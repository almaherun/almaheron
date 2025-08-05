import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifySessionToken } from '@/lib/auth-tokens';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { image, folder = 'avatars' } = await request.json();
    
    // التحقق من صحة البيانات
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // التحقق من نوع الملف بشكل أكثر صرامة
    const allowedMimeTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    const isValidMimeType = allowedMimeTypes.some(type => image.startsWith(type));
    
    if (!isValidMimeType) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }

    // التحقق من حجم الملف (تقريبي من base64)
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    
    const fileSizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    if (fileSizeInBytes > maxSizeInBytes) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed' }, { status: 400 });
    }

    // التحقق من صحة folder name لمنع path traversal
    const allowedFolders = ['avatars', 'content', 'certificates'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder specified' }, { status: 400 });
    }

    // رفع الصورة مع معرف المستخدم
    const result = await cloudinary.uploader.upload(image, {
      folder: `${folder}/${payload.uid}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });
    
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
