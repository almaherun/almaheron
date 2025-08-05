
// صفحة رئيسية ثابتة بدون JavaScript معقد
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '20px' }}>
        أكاديمية المحرون
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '40px' }}>
        منصة تعليم القرآن الكريم والتجويد عبر الإنترنت
      </p>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/auth"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1.1rem'
          }}
        >
          تسجيل الدخول
        </Link>

        <Link
          href="/auth"
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1.1rem'
          }}
        >
          إنشاء حساب جديد
        </Link>
      </div>

      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>مميزات الأكاديمية</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '40px' }}>
          <div style={{ padding: '30px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>معلمون متخصصون</h3>
            <p>فريق من المعلمين والمعلمات المجازين في القراءات</p>
          </div>

          <div style={{ padding: '30px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>حصص مباشرة</h3>
            <p>دروس تفاعلية عبر الفيديو والصوت</p>
          </div>

          <div style={{ padding: '30px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>مرونة في المواعيد</h3>
            <p>اختر الأوقات التي تناسبك</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>ابدأ رحلتك التعليمية اليوم</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
          انضم إلى آلاف الطلاب الذين يتعلمون القرآن الكريم معنا
        </p>
        <Link
          href="/auth"
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          ابدأ الآن مجاناً
        </Link>
      </div>
    </div>
  );
}
