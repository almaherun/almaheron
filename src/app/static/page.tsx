// صفحة ثابتة تماماً بدون أي JavaScript أو Context
export default function StaticPage() {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: 0,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          أكاديمية الماهرون
        </h1>
        <p style={{
          fontSize: '1.2rem',
          margin: '10px 0 0 0',
          opacity: 0.9
        }}>
          منصة تعليم القرآن الكريم والتجويد عبر الإنترنت
        </p>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '30px'
        }}>
          ابدأ رحلتك التعليمية اليوم
        </h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}>
          <a
            href="/auth"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            تسجيل الدخول
          </a>

          <a
            href="/auth"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            إنشاء حساب جديد
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '60px 20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px'
        }}>
          مميزات الأكاديمية
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              marginBottom: '15px',
              color: '#ffd43b'
            }}>
              معلمون متخصصون
            </h3>
            <p style={{
              lineHeight: '1.6',
              opacity: 0.9
            }}>
              فريق من المعلمين والمعلمات المجازين في القراءات، لتقديم أفضل تجربة تعليمية.
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              marginBottom: '15px',
              color: '#ffd43b'
            }}>
              حصص مباشرة
            </h3>
            <p style={{
              lineHeight: '1.6',
              opacity: 0.9
            }}>
              دروس تفاعلية عبر الفيديو والصوت، تضمن التجويد الصحيح والتصحيح الفوري.
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              marginBottom: '15px',
              color: '#ffd43b'
            }}>
              مرونة في المواعيد
            </h3>
            <p style={{
              lineHeight: '1.6',
              opacity: 0.9
            }}>
              اختر الأوقات التي تناسبك من جدول حصص مرن، ليتناسب مع حياتك اليومية.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          opacity: 0.8
        }}>
          جميع الحقوق محفوظة © 2025 منصة الماهرون
        </p>
        
        <div style={{
          marginTop: '20px'
        }}>
          <a href="/diagnose" style={{ color: '#ffd43b', marginRight: '20px' }}>صفحة التشخيص</a>
          <a href="/test" style={{ color: '#ffd43b', marginRight: '20px' }}>صفحة الاختبار</a>
          <a href="/debug" style={{ color: '#ffd43b' }}>صفحة Debug</a>
        </div>
      </footer>
    </div>
  );
}
