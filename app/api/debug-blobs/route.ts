import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list();
    
    return NextResponse.json({
      totalBlobs: blobs.length,
      blobs: blobs.map(b => ({
        url: b.url,
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        contentType: b.contentType,
        size: b.size,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
