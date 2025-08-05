// صفحة هبوط ثابتة تماماً بدون أي JavaScript معقد
export default function LandingPage() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>أكاديمية الماهرون</title>
        <meta name="description" content="منصة تعليم القرآن الكريم والتجويد عبر الإنترنت" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 20px;
            }
            
            .hero {
              text-align: center;
              padding: 100px 20px;
              color: white;
            }
            
            .hero h1 {
              font-size: 3.5rem;
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .hero p {
              font-size: 1.3rem;
              margin-bottom: 40px;
              opacity: 0.9;
            }
            
            .btn {
              display: inline-block;
              padding: 15px 30px;
              margin: 10px;
              text-decoration: none;
              border-radius: 8px;
              font-size: 1.1rem;
              font-weight: bold;
              transition: transform 0.3s ease;
            }
            
            .btn:hover {
              transform: translateY(-2px);
            }
            
            .btn-primary {
              background: #2563eb;
              color: white;
            }
            
            .btn-secondary {
              background: #10b981;
              color: white;
            }
            
            .features {
              background: white;
              padding: 80px 20px;
            }
            
            .features h2 {
              text-align: center;
              font-size: 2.5rem;
              margin-bottom: 50px;
              color: #2563eb;
            }
            
            .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 40px;
              margin-top: 40px;
            }
            
            .feature-card {
              text-align: center;
              padding: 40px 20px;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            
            .feature-card:hover {
              transform: translateY(-5px);
            }
            
            .feature-card h3 {
              font-size: 1.5rem;
              margin-bottom: 15px;
              color: #2563eb;
            }
            
            .feature-card p {
              color: #666;
              line-height: 1.8;
            }
            
            .cta {
              background: #2563eb;
              color: white;
              text-align: center;
              padding: 80px 20px;
            }
            
            .cta h2 {
              font-size: 2.5rem;
              margin-bottom: 20px;
            }
            
            .cta p {
              font-size: 1.2rem;
              margin-bottom: 40px;
              opacity: 0.9;
            }
            
            .footer {
              background: #1a1a1a;
              color: white;
              text-align: center;
              padding: 40px 20px;
            }
            
            @media (max-width: 768px) {
              .hero h1 {
                font-size: 2.5rem;
              }
              
              .hero p {
                font-size: 1.1rem;
              }
              
              .btn {
                display: block;
                margin: 10px auto;
                max-width: 250px;
              }
            }
          `
        }} />
      </head>
      <body>
        <div className="hero">
          <div className="container">
            <h1>أكاديمية الماهرون</h1>
            <p>منصة تعليم القرآن الكريم والتجويد عبر الإنترنت</p>
            
            <a href="/auth" className="btn btn-primary">تسجيل الدخول</a>
            <a href="/auth" className="btn btn-secondary">إنشاء حساب جديد</a>
          </div>
        </div>

        <div className="features">
          <div className="container">
            <h2>مميزات الأكاديمية</h2>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3>معلمون متخصصون</h3>
                <p>فريق من المعلمين والمعلمات المجازين في القراءات، لتقديم أفضل تجربة تعليمية.</p>
              </div>
              
              <div className="feature-card">
                <h3>حصص مباشرة</h3>
                <p>دروس تفاعلية عبر الفيديو والصوت، تضمن التجويد الصحيح والتصحيح الفوري.</p>
              </div>
              
              <div className="feature-card">
                <h3>مرونة في المواعيد</h3>
                <p>اختر الأوقات التي تناسبك من جدول حصص مرن، ليتناسب مع حياتك اليومية.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cta">
          <div className="container">
            <h2>ابدأ رحلتك التعليمية اليوم</h2>
            <p>انضم إلى آلاف الطلاب الذين يتعلمون القرآن الكريم معنا</p>
            <a href="/auth" className="btn btn-secondary">ابدأ الآن مجاناً</a>
          </div>
        </div>

        <div className="footer">
          <div className="container">
            <p>جميع الحقوق محفوظة © 2025 منصة الماهرون</p>
          </div>
        </div>
      </body>
    </html>
  );
}
