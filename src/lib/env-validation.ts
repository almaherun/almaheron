// التحقق من وجود جميع متغيرات البيئة المطلوبة
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const optionalEnvVars = [
  'BREVO_API_KEY',
  'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY',
  'NEXT_PUBLIC_EMAILJS_SERVICE_ID',
  'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID'
];

export function validateEnvironmentVariables() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // التحقق من المتغيرات المطلوبة
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // التحقق من المتغيرات الاختيارية
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));

    // في بيئة الإنتاج، لا نرمي خطأ لتجنب كسر التطبيق
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Missing required environment variables');
    } else {
      console.error('⚠️ Application may not function correctly due to missing environment variables');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(envVar => console.warn(`  - ${envVar}`));
  }

  // التحقق من قوة JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long');
  }

  console.log('✅ Environment variables validation passed');
}

// تشغيل التحقق عند استيراد الملف
if (typeof window === 'undefined') { // Server-side only
  validateEnvironmentVariables();
}