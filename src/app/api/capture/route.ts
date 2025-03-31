import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { storeCapture } from '@/lib/captureStore'; // Use alias
import * as cheerio from 'cheerio'; // Import cheerio for HTML parsing
import { Element } from 'domhandler'; // Import Element type from domhandler
import fetch from 'node-fetch'; // Use node-fetch for fetching CSS

// Increase timeout for serverless environments if needed
export const maxDuration = 60; // Increased timeout for potentially fetching CSS

export async function POST(request: NextRequest) {
  let browser = null;
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation (server-side)
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`[API /capture] Received URL for capture: ${validatedUrl.toString()}`);

    // --- Use Playwright to capture the page ---
    console.log('[API /capture] Launching browser...');
    browser = await chromium.launch();
    const context = await browser.newContext({
      // Set viewport, user agent etc. if needed
      // userAgent: 'Mozilla/5.0 ... Notate Capture Bot'
    });
    const page = await context.newPage();

    console.log(`[API /capture] Navigating to ${validatedUrl.toString()}...`);
    try {
      // Wait until network activity settles, might need adjustment
      await page.goto(validatedUrl.toString(), { waitUntil: 'networkidle', timeout: 45000 }); // Increased navigation timeout
    } catch (navError) {
      console.error(`[API /capture] Navigation error for ${validatedUrl.toString()}:`, navError);
      // Attempt to get content even if networkidle timed out, maybe DOM loaded?
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }); // Increased DOM timeout
        console.log(`[API /capture] Navigation partially succeeded (DOM loaded) for ${validatedUrl.toString()}`);
      } catch (domError) {
        console.error(`[API /capture] DOM content loading also failed for ${validatedUrl.toString()}:`, domError);
        // If even DOM load fails, return an error
        await browser.close(); // Ensure browser is closed before returning
        browser = null;
        // Check error type before accessing message
        const navErrorMessage = navError instanceof Error ? navError.message : String(navError);
        return NextResponse.json({ error: `Failed to navigate to URL: ${navErrorMessage}` }, { status: 502 }); // 502 Bad Gateway might be appropriate
      }
    }

    console.log(`[API /capture] Capturing content for ${validatedUrl.toString()}...`);
    const htmlContent = await page.content();
    console.log(`[API /capture] Content captured (Size: ${Math.round(htmlContent.length / 1024)} KB)`);

    // --- Asset rewriting --- 
    const captureId = `cap_${Date.now()}`;
    const $ = cheerio.load(htmlContent);

    // Helper function to create absolute URLs
    const makeAbsolute = (srcUrl: string, base: string): string => {
      try {
        return new URL(srcUrl, base).toString();
      } catch (e) {
        // If base is invalid or url parsing fails, return original
        return srcUrl;
      }
    };

    // Updated Helper function to rewrite URLs, accepting a base URL for relative paths
    const rewriteUrl = (srcUrl: string, base: string) => {
      if (!srcUrl || srcUrl.startsWith('data:')) return srcUrl; // Ignore empty or data URLs
      
      const absoluteUrl = makeAbsolute(srcUrl, base);
      
      // Encode the absolute URL for the proxy endpoint
      return `/api/asset/${captureId}?url=${encodeURIComponent(absoluteUrl)}`;
    };

    // --- Rewrite URLs in common attributes --- 
    const attributesToRewrite = [
      { selector: 'link[href]', attr: 'href' },
      { selector: 'script[src]', attr: 'src' },
      { selector: 'img[src]', attr: 'src' },
      { selector: 'img[srcset]', attr: 'srcset' }, // Handle srcset below
      { selector: 'source[src]', attr: 'src' },
      { selector: 'source[srcset]', attr: 'srcset' }, // Handle srcset below
      { selector: 'video[poster]', attr: 'poster' },
      { selector: 'video[src]', attr: 'src' },
      { selector: 'audio[src]', attr: 'src' },
      { selector: 'object[data]', attr: 'data' },
      { selector: 'embed[src]', attr: 'src' },
      { selector: 'iframe[src]', attr: 'src' },
      { selector: '[data-src]', attr: 'data-src' },
      { selector: '[style*="background"]', attr: 'style' }, // Handle style below
    ];

    for (const { selector, attr } of attributesToRewrite) {
      // Use a standard for...of loop over .get() results
      for (const elem of $(selector).get()) {
        const element = $(elem); // Wrap the raw element back with Cheerio
        const originalValue = element.attr(attr);

        if (!originalValue) continue; // Use continue instead of return

        if (attr === 'srcset') {
          const newSrcset = originalValue.split(',').map(src => {
            const [url, size] = src.trim().split(/\s+/);
            return `${rewriteUrl(url, validatedUrl.toString())} ${size || ''}`;
          }).join(', ');
          element.attr(attr, newSrcset);
        } else if (attr === 'style') {
           if (originalValue.includes('url(')) {
             const newStyle = originalValue.replace(/url\(['"]?([^'"\)]+)['"]?\)/g, (match, url) => {
                // Use validatedUrl as base for styles defined directly on elements
                return `url(${rewriteUrl(url, validatedUrl.toString())})`; 
             });
             element.attr(attr, newStyle);
           }
        } else if (attr === 'href' && element.is('link[rel="stylesheet"]')) {
           // Handled separately below
           continue; // Use continue
        } else if (element.is('iframe')) {
            // Maybe proxy iframes later? For now, keep original src
            // element.attr(attr, rewriteUrl(originalValue, validatedUrl.toString())); 
        } else {
          element.attr(attr, rewriteUrl(originalValue, validatedUrl.toString()));
        }
      }
    }

    // --- Handle @font-face and other urls in <style> tags --- 
    $('style').each((i: number, elem: Element) => {
      const styleContent = $(elem).html();
      if (styleContent) {
        const newStyleContent = styleContent.replace(/url\(['"]?([^'"\)]+)['"]?\)/g, (match, url) => {
           // Use validatedUrl as base for inline styles
           return `url(${rewriteUrl(url, validatedUrl.toString())})`;
        });
        $(elem).html(newStyleContent);
      }
    });

    // --- Process external CSS files --- 
    const stylesheetPromises: Promise<void>[] = [];
    // Use a for...of loop for consistency and to avoid potential context issues
    for (const elem of $('link[rel="stylesheet"]').get()) {
        const promise = (async () => {
            const element = $(elem); // Wrap raw element
            const href = element.attr('href');
            if (!href) return;

            const cssUrl = makeAbsolute(href, validatedUrl.toString());
            console.log(`[API /capture] Processing external CSS: ${cssUrl}`);
            try {
                const cssResponse = await fetch(cssUrl, { 
                    headers: { 'User-Agent': 'Notate Capture Bot' },
                    redirect: 'follow'
                });
                if (cssResponse.ok) {
                const cssContent = await cssResponse.text();
                // Rewrite URLs within the fetched CSS, using the CSS file's URL as the base
                const rewrittenCss = cssContent.replace(/url\(['"]?([^'"\)]+)['"]?\)/g, (match: string, url: string) => {
                    return `url(${rewriteUrl(url, cssUrl)})`;
                });
                // Replace the <link> tag with an inline <style> tag
                element.replaceWith(`<style>${rewrittenCss}</style>`);
                console.log(`[API /capture] Inlined CSS from: ${cssUrl}`);
                } else {
                    console.warn(`[API /capture] Failed to fetch CSS: ${cssUrl} - Status: ${cssResponse.status}`);
                    element.remove(); // Remove link if CSS couldn't be fetched
                }
            } catch (cssError) {
                console.error(`[API /capture] Error fetching or processing CSS ${cssUrl}:`, cssError);
                element.remove(); // Remove link on error
            }
        })();
        stylesheetPromises.push(promise);
    }

    await Promise.all(stylesheetPromises);
    console.log('[API /capture] Finished processing external CSS.');

    // Get the final modified HTML
    const modifiedHtmlContent = $.html();

    // Store both the HTML and the original URL
    await storeCapture(captureId, {
      html: modifiedHtmlContent,
      originalUrl: validatedUrl.toString()
    });

    console.log(`[API /capture] Generated and stored captureId: ${captureId} for URL: ${validatedUrl.toString()}`);

    // Return the generated capture ID
    return NextResponse.json({ captureId });

  } catch (error) {
    console.error('[API /capture] Error processing capture request:', error);
    // Check error type before accessing message
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const status = errorMessage.includes('Failed to navigate') || errorMessage.includes('Navigation timeout') ? 502 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  } finally {
    if (browser) {
      console.log('[API /capture] Closing browser.');
      await browser.close();
    }
  }
} 