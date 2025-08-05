# 🚀 نشر مشروع Al Maheron Academy على Netlify

## 📋 الخطوات المطلوبة:

### 1. إنشاء حساب Netlify
- اذهب إلى: https://netlify.com
- سجل دخول باستخدام GitHub

### 2. ربط المشروع
- اضغط "New site from Git"
- اختر GitHub
- اختر repository: `update_almaheron_app`

### 3. إعدادات البناء
```
Build command: npm run build
Publish directory: .next
```

### 4. متغيرات البيئة المطلوبة
انتقل إلى Site settings > Environment variables وأضف:

#### Firebase Configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=almaheron-webapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=almaheron-webapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=almaheron-webapp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

#### Other Services:
```
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
BREVO_API_KEY=your_brevo_api_key
```

**ملاحظة**: استخدم المفاتيح الحقيقية من ملف `.env.local` المحلي

### 5. إعدادات إضافية
- Node.js version: 18
- Package manager: npm

### 6. النشر
- اضغط "Deploy site"
- انتظر اكتمال البناء (5-10 دقائق)

## 🔧 ملفات التكوين المضافة:
- ✅ `netlify.toml` - إعدادات Netlify
- ✅ `@netlify/plugin-nextjs` - Plugin للـ Next.js
- ✅ إزالة ملفات Vercel

## 🎯 المميزات:
- ✅ دعم Next.js كامل
- ✅ Serverless Functions
- ✅ SSL مجاني
- ✅ CI/CD تلقائي
- ✅ 100GB bandwidth مجاناً

## 🔗 بعد النشر:
1. احصل على رابط الموقع من Netlify Dashboard
2. اختبر جميع الصفحات
3. تأكد من عمل Firebase
4. اختبر رفع الصور مع Cloudinary

## 🆘 في حالة المشاكل:
- تحقق من Build logs في Netlify
- تأكد من متغيرات البيئة
- استخدم صفحة `/diagnose` للتشخيص
