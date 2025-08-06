# دليل إعداد الأمان - أكاديمية الماهرون

## 🚨 خطوات عاجلة يجب تنفيذها فوراً

### 1. تأمين متغيرات البيئة
```bash
# إنشاء JWT secret قوي
openssl rand -base64 64

# نسخ الملف المثال
cp .env.local.example .env.local

# تحديث جميع المفاتيح بقيم حقيقية وآمنة
```

### 2. إزالة المفاتيح المكشوفة
⚠️ **تحذير**: الملف `.env.local` الحالي يحتوي على مفاتيح حساسة مكشوفة!

**يجب فوراً:**
1. تغيير جميع المفاتيح في الخدمات الخارجية:
   - Brevo API Key
   - Cloudinary API Keys
   - Firebase Configuration (إذا أمكن)

2. إنشاء مفاتيح جديدة وآمنة

3. التأكد من عدم رفع `.env.local` إلى Git

### 3. التحقق من .gitignore
```bash
# التأكد من أن .gitignore يتجاهل الملفات الحساسة
echo ".env*" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
```

## 🛡️ التحسينات المطبقة

### ✅ تم إصلاحها:
1. **إصلاح .gitignore** - إزالة الـ backslash الخاطئ
2. **تقوية JWT Secret** - إضافة validation للطول والوجود
3. **تحسين أمان رفع الملفات** - إضافة فحص الحجم والنوع
4. **تنظيف Console Logs** - إخفاء المعلومات الحساسة
5. **إضافة Error Boundary** - للتعامل مع الأخطاء بأمان
6. **تحسين CSP** - Content Security Policy أكثر صرامة

### 🔄 يحتاج متابعة:
1. **Rate Limiting محسن** - استخدام Redis أو database
2. **CSRF Protection** - إضافة tokens للنماذج
3. **Input Sanitization** - إضافة DOMPurify
4. **Session Management** - آلية إلغاء الجلسات

## 🔐 أفضل الممارسات الأمنية
يبؤيربلا
### متغيرات البيئة:
```bash
# استخدم secrets قوية
JWT_SECRET=$(openssl rand -base64 64)
ب
# لا تضع أسرار في الكود
# استخدم environment variables دائماً
```

### رفع الملفات:
```typescript
// فحص نوع الملف
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// فحص الحجم
const maxSize = 5 * 1024 * 1024; // 5MB

// فحص المحتوى (ليس فقط الامتداد)
```

### التسجيل الآمن:
```typescript
// لا تسجل معلومات حساسة
console.log('User logged in:', userId); // ✅ آمن
console.log('Password:', password); // ❌ خطر

// استخدم masking للبيانات الحساسة
const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');
```

## 🚀 خطوات التطوير التالية

### الأولوية العالية:
1. **تطبيق Rate Limiting محسن**
   ```bash
   npm install ioredis
   # أو استخدام database-based solution
   ```

2. **إضافة CSRF Protection**
   ```bash
   npm install csrf
   ```

3. **تطبيق Input Sanitization**
   ```bash
   npm install dompurify
   npm install @types/dompurify
   ```

### الأولوية المتوسطة:
4. **إضافة Helmet.js**
   ```bash
   npm install helmet
   ```

5. **تطبيق Monitoring**
   ```bash
   npm install @sentry/nextjs
   ```

## 📋 Checklist للنشر

### قبل النشر:
- [ ] تغيير جميع المفاتيح الحساسة
- [ ] التأكد من قوة JWT_SECRET
- [ ] فحص .gitignore
- [ ] اختبار Error Boundaries
- [ ] فحص CSP headers
- [ ] اختبار رفع الملفات

### بعد النشر:
- [ ] مراقبة الأخطاء
- [ ] فحص الأداء
- [ ] مراجعة logs الأمان
- [ ] اختبار Rate Limiting

## 🆘 في حالة الطوارئ

### إذا تم اختراق المفاتيح:
1. **فوراً**: تعطيل المفاتيح المخترقة
2. **إنشاء مفاتيح جديدة**
3. **تحديث التطبيق**
4. **مراجعة logs للأنشطة المشبوهة**
5. **إشعار المستخدمين إذا لزم الأمر**

### جهات الاتصال:
- **Firebase Support**: [Firebase Console](https://console.firebase.google.com)
- **Cloudinary Support**: [Cloudinary Dashboard](https://cloudinary.com/console)
- **Brevo Support**: [Brevo Dashboard](https://app.brevo.com)

---

**تاريخ آخر تحديث:** $(date)
**المسؤول:** فريق الأمان - أكاديمية الماهرون

⚠️ **تذكير مهم**: هذا الملف يحتوي على معلومات حساسة حول الأمان. لا تشاركه مع أشخاص غير مخولين.