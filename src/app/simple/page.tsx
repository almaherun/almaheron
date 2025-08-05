export default function SimplePage() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>صفحة بسيطة للاختبار</h1>
      <p>هذه صفحة بسيطة جداً بدون أي مكتبات معقدة</p>
      <p>إذا ظهرت هذه الصفحة، فالمشكلة في الصفحة الرئيسية</p>
      <p>الوقت الحالي: {new Date().toLocaleString('ar-SA')}</p>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#0066cc', textDecoration: 'underline' }}>
          العودة للصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
