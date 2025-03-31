import { NextRequest, NextResponse } from 'next/server';
import { getCapture } from '@/lib/captureStore'; // Import the getter

// Remove the old placeholder function
/*
async function getCapturedHtml(captureId: string): Promise<string | null> {
  // ... old placeholder code ...
}
*/

export async function GET(
  request: NextRequest,
  { params }: { params: { captureId: string } }
) {
  const {captureId} = await params;

  if (!captureId) {
    // Use NextResponse for consistency with the other API route
    return NextResponse.json({ error: 'Capture ID is required' }, { status: 400 });
  }

  try {
    // Retrieve content directly from the store
    console.log(`[API /content] Attempting to retrieve content for captureId: ${captureId}`);
    const htmlContent = await getCapture(captureId); // This is synchronous now

    if (!htmlContent) {
      console.warn(`[API /content] Content not found for captureId: ${captureId}`);
      return NextResponse.json({ error: 'Captured content not found' }, { status: 404 });
    }

    console.log(`[API /content] Found content for ${captureId}, returning HTML.`);
    // Return the actual captured HTML content
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        // Add appropriate caching headers later
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        // --- Security Headers --- 
        // Prevent the iframe from navigating the top-level window
        'Content-Security-Policy': "frame-ancestors 'self';", 
        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff', 
        // Prevent clickjacking
        'X-Frame-Options': 'SAMEORIGIN', 
      },
    });

  } catch (error) {
    console.error(`[API /content] Error fetching content for ${captureId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 