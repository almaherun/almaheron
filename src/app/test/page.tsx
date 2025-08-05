export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>صفحة اختبار - Al Maheron Academy</h1>
      <p>إذا كنت ترى هذه الصفحة، فإن التطبيق يعمل بشكل صحيح.</p>
      <p>التاريخ والوقت: {new Date().toLocaleString('ar-SA')}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>اختبار متغيرات البيئة:</h2>
        <ul>
          <li>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'غير محدد'}</li>
          <li>Firebase Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'غير محدد'}</li>
          <li>Cloudinary Cloud Name: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'غير محدد'}</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          العودة للصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
