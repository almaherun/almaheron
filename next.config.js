/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات الصور
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },

  compress: true,

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
