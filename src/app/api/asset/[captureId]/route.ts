import { NextRequest, NextResponse } from 'next/server';
import { getFullCapture } from '@/lib/captureStore';

export async function GET(request: NextRequest, { params }: { params: { captureId: string } }) {
  const { captureId } = await params;
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // The URL should now be absolute (either https:// or http://)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotateBot/1.0; +http://notate.example.com)',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': url, // Add referer to help with some CDNs
      },
      redirect: 'follow', // Follow redirects
    });

    if (!response.ok) {
      console.error(`Failed to fetch asset from ${url}: ${response.status} ${response.statusText}`);
      // For 404s, return a transparent 1x1 GIF to prevent broken image placeholders
      if (response.status === 404) {
        const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        return new NextResponse(transparentGif, {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
      return NextResponse.json({ error: 'Failed to fetch asset' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    // Set CORS headers to allow the asset to be loaded from our domain
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    // For network errors, return a transparent 1x1 GIF
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new NextResponse(transparentGif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }
} 