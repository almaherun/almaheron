import axios from 'axios';

const brevoApi = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': process.env.BREVO_API_KEY!
  }
});

export const sendVerificationCode = async (
  userEmail: string, 
  userName: string, 
  verificationCode: string
) => {
  try {
    // إزالة console.log الحساسة - استخدام logger آمن
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting to send email to:', userEmail.replace(/(.{2}).*(@.*)/, '$1***$2'));
    }
    
    const response = await brevoApi.post('/smtp/email', {
      sender: {
        name: 'أكاديمية الماهرون',
        email: 'noreply@almahirun.com'
      },
      to: [{
        email: userEmail,
        name: userName
      }],
      subject: 'رمز التحقق - أكاديمية الماهرون',
      htmlContent: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${userName}</h2>
          <p>رمز التحقق الخاص بك هو:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>هذا الرمز صالح لمدة 10 دقائق فقط.</p>
        </div>
      `
    });

    return { success: true, messageId: response.data.messageId };
  } catch (error: any) {
    // تسجيل آمن للأخطاء
    console.error('Email sending failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetCode = async (
  userEmail: string, 
  userName: string, 
  resetCode: string
) => {
  try {
    const response = await brevoApi.post('/smtp/email', {
      sender: {
        name: 'أكاديمية الماهرون',
        email: 'noreply@almahirun.com'
      },
      to: [{
        email: userEmail,
        name: userName
      }],
      subject: 'إعادة تعيين كلمة المرور - أكاديمية الماهرون',
      htmlContent: `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; background: #f8fafc; }
            .code-box { 
              background: white; 
              border: 3px dashed #dc2626; 
              padding: 25px; 
              text-align: center; 
              margin: 25px 0;
              border-radius: 10px;
            }
            .code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #dc2626; 
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .warning { 
              color: #ef4444; 
              font-weight: bold; 
              font-size: 16px;
              text-align: center;
              margin: 20px 0;
            }
            .footer { 
              background: #dc2626; 
              padding: 20px; 
              text-align: center; 
              color: white; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 إعادة تعيين كلمة المرور</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #dc2626; margin-bottom: 20px;">مرحباً ${userName}</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
                تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم الكود التالي:
              </p>
              
              <div class="code-box">
                <div class="code">${resetCode}</div>
              </div>
              
              <div class="warning">
                ⏰ هذا الكود صالح لمدة 3 دقائق فقط
              </div>
              
              <div style="background: #fee2e2; border-right: 4px solid #dc2626; padding: 15px; margin: 25px 0; border-radius: 5px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  <strong>تحذير:</strong> إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة وتأمين حسابك.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© 2024 أكاديمية الماهرون</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'فشل في إرسال البريد الإلكتروني' 
    };
  }
};
