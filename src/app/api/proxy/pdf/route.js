import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[Proxy] Processing PDF request: ${url}`);

    // Verify Cloudinary Config
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[Proxy] Cloudinary credentials missing in environment variables');
    }

    try {
      // 1. Try fetching with SDK first for authorization
      const urlParts = url.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      
      if (uploadIndex !== -1) {
        const resourceType = urlParts[uploadIndex - 1];
        let publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
        if (publicIdWithExt.startsWith('v')) {
          const firstSlash = publicIdWithExt.indexOf('/');
          publicIdWithExt = publicIdWithExt.substring(firstSlash + 1);
        }
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

        console.log(`[Proxy] SDK Attempt: ${publicId} (${resourceType})`);

        // Generate a PRIVATE DOWNLOAD URL (This is the most authorized way for private assets)
        const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: resourceType,
          type: 'upload',
          expires_at: Math.round(Date.now() / 1000) + 3600 // 1 hour
        });

        console.log(`[Proxy] Fetching from Private Download URL: ${signedUrl}`);
        const response = await fetch(signedUrl);
        
        if (response.ok) {
          const blob = await response.blob();
          return new Response(blob, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600'
            },
          });
        }
        console.warn(`[Proxy] Signed URL fetch failed with status: ${response.status}`);
      }
    } catch (sdkError) {
      console.error('[Proxy] SDK processing failed:', sdkError);
    }

    // 2. Final Fallback: Direct fetch with Basic Auth
    console.log('[Proxy] Final fallback: Direct fetch with Basic Auth');
    const auth = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');
    const finalResponse = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!finalResponse.ok) {
      console.error(`[Proxy] All fetch attempts failed. Final status: ${finalResponse.status}`);
      return NextResponse.json({ error: 'Failed to retrieve document' }, { status: finalResponse.status });
    }

    const finalBlob = await finalResponse.blob();
    return new Response(finalBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[Proxy] Critical Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
