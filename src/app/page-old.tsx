
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Clock, Award } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 ml-3" />
              <h1 className="text-2xl font-bold text-gray-900">أكاديمية الماهرون</h1>
            </div>
            <div className="flex space-x-4 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => router.push('/auth')}
              >
                تسجيل الدخول
              </Button>
              <Button
                onClick={() => router.push('/auth')}
              >
                إنشاء حساب
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            تعلم القرآن الكريم والتجويد عبر الإنترنت
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            منصة تعليمية متطورة تجمع بين المعلمين المتخصصين والطلاب الراغبين في تعلم القرآن الكريم وأحكام التجويد
          </p>
          <div className="flex justify-center space-x-4 space-x-reverse">
            <Button
              size="lg"
              onClick={() => router.push('/auth')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ابدأ التعلم الآن
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/auth')}
            >
              انضم كمعلم
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>معلمون متخصصون</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                فريق من المعلمين والمعلمات المجازين في القراءات والتجويد
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>مرونة في المواعيد</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                اختر الأوقات التي تناسبك من جدول حصص مرن ومتنوع
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>منهج شامل</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                برنامج تعليمي متكامل يغطي جميع جوانب تعلم القرآن والتجويد
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>شهادات معتمدة</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                احصل على شهادات معتمدة عند إتمام المستويات التعليمية
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ابدأ رحلتك التعليمية اليوم
          </h3>
          <p className="text-gray-600 mb-6">
            انضم إلى آلاف الطلاب الذين يتعلمون القرآن الكريم معنا
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/auth')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            سجل الآن مجاناً
          </Button>
        </div>


      </main>
    </div>
  );
}
