// دالة لرفع الصور عبر API Route
export const uploadToCloudinary = async (imageData: string, folder: string = 'avatars') => {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        folder: folder,
      }),
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
