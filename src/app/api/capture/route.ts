import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { storeCapture } from '@/lib/captureStore'; // Use alias

// Increase timeout for serverless environments if needed
export const maxDuration = 30; // Vercel specific: Allow up to 30 seconds

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
      await page.goto(validatedUrl.toString(), { waitUntil: 'networkidle', timeout: 25000 }); 
    } catch (navError) {
        console.error(`[API /capture] Navigation error for ${validatedUrl.toString()}:`, navError);
        // Attempt to get content even if networkidle timed out, maybe DOM loaded?
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
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

    // --- Asset rewriting would happen here --- 
    // TODO: Implement logic to find all asset URLs (css, js, img, etc.)
    // TODO: Download assets or rewrite URLs to proxy through our service
    // For now, we store the HTML with original asset links.

    // Generate a unique ID (still basic, consider UUIDs later)
    const captureId = `cap_${Date.now()}`;

    // Store the captured HTML in our temporary store
    storeCapture(captureId, htmlContent);

    console.log(`[API /capture] Generated and stored captureId: ${captureId} for URL: ${validatedUrl.toString()}`);

    // Return the generated capture ID
    return NextResponse.json({ captureId });

  } catch (error) {
    console.error('[API /capture] Error processing capture request:', error);
    // Ensure status code indicates server error
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