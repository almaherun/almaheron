#!/bin/bash
echo "🔍 فحص ما قبل الرفع..."

# فحص الأمان
npm run security-check

# فحص الأنواع
npm run type-check

# تشغيل الاختبارات
npm run test

# بناء المشروع
npm run build

echo "✅ جاهز للرفع!"