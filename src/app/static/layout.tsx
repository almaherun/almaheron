// Layout خاص للصفحات الثابتة بدون AuthProvider
export default function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>أكاديمية الماهرون - صفحة ثابتة</title>
        <meta name="description" content="منصة تعليم القرآن الكريم والتجويد عبر الإنترنت" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
