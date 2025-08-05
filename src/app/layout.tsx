import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Cairo } from 'next/font/google';
// import '@/lib/env-validation'; // تم تعطيل التحقق لتجنب مشاكل التحميل

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'أكاديمية الماهرون',
  description: 'منصة تعليمية تفاعلية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <ErrorBoundary>
          <Toaster />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
