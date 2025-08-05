import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// إنشاء window object للـ server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// تكوين DOMPurify للأمان القصوى
purify.setConfig({
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: false,
  ADD_TAGS: [], // لا نسمح بأي tags إضافية
  ADD_ATTR: [], // لا نسمح بأي attributes إضافية
  FORBID_TAGS: [
    'script', 'object', 'embed', 'link', 'style', 'iframe', 
    'frame', 'frameset', 'applet', 'meta', 'form', 'input',
    'button', 'textarea', 'select', 'option'
  ],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
    'onabort', 'onkeydown', 'onkeypress', 'onkeyup', 'onunload'
  ]
});

/**
 * تنظيف النصوص من HTML والـ scripts الضارة
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

/**
 * تنظيف النص العادي (إزالة جميع HTML tags)
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * تنظيف البريد الإلكتروني
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  // إزالة المسافات والأحرف الخاصة
  const cleaned = email.trim().toLowerCase();
  
  // فحص صيغة البريد الإلكتروني
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  
  return cleaned;
}

/**
 * تنظيف رقم الهاتف
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // إزالة جميع الأحرف غير الرقمية
  const cleaned = phone.replace(/\D/g, '');
  
  // فحص صيغة رقم الهاتف المصري
  const phoneRegex = /^01[0-9]{9}$/;
  
  if (!phoneRegex.test(cleaned)) {
    throw new Error('Invalid phone number format');
  }
  
  return cleaned;
}

/**
 * تنظيف الأسماء
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  
  // إزالة HTML tags
  let cleaned = sanitizePlainText(name);
  
  // إزالة الأحرف الخاصة والأرقام (السماح بالعربية والإنجليزية والمسافات فقط)
  cleaned = cleaned.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
  
  // إزالة المسافات الزائدة
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length < 2) {
    throw new Error('Name must be at least 2 characters long');
  }
  
  if (cleaned.length > 50) {
    throw new Error('Name must be less than 50 characters');
  }
  
  return cleaned;
}

/**
 * تنظيف كلمات المرور
 */
export function sanitizePassword(password: string): string {
  if (typeof password !== 'string') {
    return '';
  }
  
  // لا نغير كلمة المرور، فقط نتحقق من صحتها
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password is too long');
  }
  
  // فحص وجود أحرف كبيرة وصغيرة وأرقام
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw new Error('Password must contain uppercase, lowercase, and numbers');
  }
  
  return password;
}

/**
 * تنظيف URLs
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  try {
    const urlObj = new URL(url);
    
    // السماح فقط بـ HTTP و HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }
    
    return urlObj.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * تنظيف JSON data
 */
export function sanitizeJSON(data: any): any {
  if (typeof data === 'string') {
    return sanitizePlainText(data);
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJSON(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // تنظيف المفتاح
      const cleanKey = sanitizePlainText(key);
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeJSON(value);
      }
    }
    
    return sanitized;
  }
  
  return null;
}

/**
 * تنظيف بيانات النماذج
 */
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    try {
      switch (key) {
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
          
        case 'phone':
        case 'phoneNumber':
          sanitized[key] = sanitizePhoneNumber(value);
          break;
          
        case 'name':
        case 'fullName':
        case 'firstName':
        case 'lastName':
          sanitized[key] = sanitizeName(value);
          break;
          
        case 'password':
        case 'newPassword':
        case 'confirmPassword':
          sanitized[key] = sanitizePassword(value);
          break;
          
        case 'url':
        case 'website':
        case 'avatarUrl':
          sanitized[key] = sanitizeURL(value);
          break;
          
        default:
          // للحقول الأخرى، استخدم تنظيف عام
          if (typeof value === 'string') {
            sanitized[key] = sanitizePlainText(value);
          } else {
            sanitized[key] = sanitizeJSON(value);
          }
      }
    } catch (error) {
      // إذا فشل التنظيف، ارمي خطأ مع تفاصيل الحقل
      throw new Error(`Invalid ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return sanitized;
}

/**
 * فحص وجود محتوى ضار محتمل
 */
export function detectMaliciousContent(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /eval\(/i,
    /expression\(/i,
    /url\(/i,
    /import\(/i,
    /@import/i,
    /document\./i,
    /window\./i,
    /alert\(/i,
    /confirm\(/i,
    /prompt\(/i
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * تنظيف شامل للبيانات الواردة من API
 */
export function sanitizeAPIInput(data: any): any {
  // فحص وجود محتوى ضار
  const dataString = JSON.stringify(data);
  if (detectMaliciousContent(dataString)) {
    throw new Error('Malicious content detected');
  }
  
  // تنظيف البيانات
  return sanitizeJSON(data);
}

/**
 * Middleware للتنظيف التلقائي
 */
export function createSanitizationMiddleware() {
  return (data: any) => {
    try {
      return sanitizeAPIInput(data);
    } catch (error) {
      console.error('Sanitization failed:', error);
      throw new Error('Invalid input data');
    }
  };
}