// تعطيل EmailJS مؤقت
// import emailjs from '@emailjs/browser';

export const sendEmail = async (templateParams: any) => {
  try {
    console.log('Email service temporarily disabled');
    console.log('Template params:', templateParams);
    return { status: 200, text: 'Email service will be available soon' };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendVerificationCodeEmailJS = async (email: string, code: string, name: string) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification email service temporarily disabled');
      console.log('Email:', email.replace(/(.{2}).*(@.*)/, '$1***$2'), 'Name:', name);
      // لا نطبع الكود في الـ console لأسباب أمنية
    }
    return { status: 200, text: 'Verification email will be sent soon' };
  } catch (error) {
    console.error('Verification email error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const initEmailJS = () => {
  console.log('EmailJS initialization temporarily disabled');
};

// إضافة exports إضافية للتوافق
export default {
  sendEmail,
  sendVerificationCodeEmailJS,
  initEmailJS
};
