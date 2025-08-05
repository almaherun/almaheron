'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Smooth scrolling for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.href && target.href.includes('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 80; // Account for fixed header

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <>
      {/* Google Icons */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: '#0A3D62' }}>
          <div className="max-w-6xl mx-auto px-6">
            <nav className="flex justify-between items-center py-4">
              <Link href="/" className="text-2xl font-bold text-white">
                الماهرون
              </Link>
              
              {/* Desktop Navigation */}
              <ul className="hidden md:flex space-x-6 space-x-reverse">
                <li><a href="#hero" className="text-white hover:text-[#60A3BC] transition-colors font-medium">الرئيسية</a></li>
                <li><a href="#features" className="text-white hover:text-[#60A3BC] transition-colors font-medium">المميزات</a></li>
                <li><a href="#about" className="text-white hover:text-[#60A3BC] transition-colors font-medium">من نحن</a></li>
                <li><a href="#contact" className="text-white hover:text-[#60A3BC] transition-colors font-medium">تواصل معنا</a></li>
              </ul>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex space-x-2 space-x-reverse">
                <button 
                  onClick={() => router.push('/auth')}
                  className="px-4 py-2 rounded-md font-bold transition-all hover:transform hover:-translate-y-1"
                  style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
                >
                  تسجيل الدخول
                </button>
                <button 
                  onClick={() => router.push('/auth')}
                  className="px-4 py-2 rounded-md font-bold transition-all hover:transform hover:-translate-y-1"
                  style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
                >
                  إنشاء حساب
                </button>
              </div>

              {/* Mobile Hamburger */}
              <button 
                className="md:hidden text-white text-2xl p-2"
                onClick={toggleSidebar}
              >
                <i className="fas fa-bars"></i>
              </button>
            </nav>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-64 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
             style={{ backgroundColor: '#2C3A47' }}>
          <div className="p-6">
            <button 
              className="absolute top-4 left-4 text-white text-2xl"
              onClick={closeSidebar}
            >
              <i className="fas fa-times"></i>
            </button>
            
            <ul className="mt-12 space-y-4">
              <li><a href="#hero" className="block text-white py-3 px-4 border-b border-gray-600 hover:bg-[#3C6382] rounded" onClick={closeSidebar}>الرئيسية</a></li>
              <li><a href="#features" className="block text-white py-3 px-4 border-b border-gray-600 hover:bg-[#3C6382] rounded" onClick={closeSidebar}>المميزات</a></li>
              <li><a href="#about" className="block text-white py-3 px-4 border-b border-gray-600 hover:bg-[#3C6382] rounded" onClick={closeSidebar}>من نحن</a></li>
              <li><a href="#contact" className="block text-white py-3 px-4 border-b border-gray-600 hover:bg-[#3C6382] rounded" onClick={closeSidebar}>تواصل معنا</a></li>
            </ul>
            
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => { router.push('/auth'); closeSidebar(); }}
                className="w-full py-3 px-4 rounded-md font-bold text-center"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                تسجيل الدخول
              </button>
              <button 
                onClick={() => { router.push('/auth'); closeSidebar(); }}
                className="w-full py-3 px-4 rounded-md font-bold text-center"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Hero Section */}
        <section id="hero" className="relative min-h-[600px] flex items-center justify-center text-white text-center py-32"
                 style={{ 
                   backgroundImage: 'url("https://images.unsplash.com/photo-1609599006353-e629aaabfeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80")',
                   backgroundSize: 'cover',
                   backgroundPosition: 'center'
                 }}>
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              منصة الماهرون لتحفيظ القرآن الكريم أونلاين
            </h1>
            <p className="text-lg md:text-2xl mb-8 opacity-90">
              انضم إلينا لتبدأ رحلتك في حفظ وتجويد القرآن الكريم على يد معلمين متخصصين، في أي وقت ومن أي مكان.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/auth')}
                className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:transform hover:-translate-y-1"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                ابدأ الآن مجاناً
              </button>
              <button 
                onClick={() => router.push('/auth')}
                className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:transform hover:-translate-y-1"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 text-center" style={{ backgroundColor: '#F5F6FA' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 relative inline-block" style={{ color: '#0A3D62' }}>
              مميزات منصة الماهرون
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-20 h-1 rounded" style={{ backgroundColor: '#60A3BC' }}></div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-book-reader text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>معلمون متخصصون</h3>
                <p className="text-gray-700">فريق من المعلمين والمعلمات المجازين في القراءات، لتقديم أفضل تجربة تعليمية.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-video text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>حصص مباشرة</h3>
                <p className="text-gray-700">دروس تفاعلية عبر الفيديو والصوت، تضمن التجويد الصحيح والتصحيح الفوري.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-calendar-alt text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>مرونة في المواعيد</h3>
                <p className="text-gray-700">اختر الأوقات التي تناسبك من جدول حصص مرن، ليتناسب مع حياتك اليومية.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-chart-line text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>متابعة التقدم</h3>
                <p className="text-gray-700">نظام متكامل لمتابعة تقدمك في الحفظ والمراجعة، مع تقارير دورية.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-shield-alt text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>بيئة آمنة وداعمة</h3>
                <p className="text-gray-700">منصة مصممة لتوفير بيئة تعليمية إيجابية ومشجعة للجميع.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:transform hover:-translate-y-3 transition-all duration-300 text-right">
                <i className="fas fa-globe text-5xl mb-4" style={{ color: '#3C6382' }}></i>
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#0A3D62' }}>من أي مكان في العالم</h3>
                <p className="text-gray-700">خدماتنا متاحة لجميع الطلاب في جميع أنحاء العالم، كل ما تحتاجه هو اتصال بالإنترنت.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-white text-center">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 relative inline-block" style={{ color: '#0A3D62' }}>
              من نحن
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-20 h-1 rounded" style={{ backgroundColor: '#60A3BC' }}></div>
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-12 mt-8">
              <div className="flex-1 text-right">
                <p className="text-lg text-gray-700 mb-4">
                  في منصة الماهرون، نؤمن بأن تعلم القرآن الكريم يجب أن يكون متاحاً للجميع، بغض النظر عن موقعهم الجغرافي أو جدولهم الزمني. لذلك، قمنا ببناء هذه المنصة لتوفير تجربة تعليمية فريدة وميسرة لتحفيظ وتجويد كتاب الله.
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  نحن نجمع بين أحدث التقنيات وأفضل الممارسات التعليمية لضمان جودة التعليم. فريقنا من المعلمين المجازين ملتزم بتوجيه كل طالب في رحلته الروحانية، بدءاً من المبتدئين وصولاً إلى الراغبين في إتقان القراءات.
                </p>
                <p className="text-lg text-gray-700">
                  هدفنا هو تمكينك من الارتباط بالقرآن الكريم، فهمه، وتطبيقه في حياتك اليومية، وذلك من خلال منهج تعليمي مبني على التجويد، الفهم، والتطبيق.
                </p>
              </div>
              <div className="flex-1">
                <img
                  src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="About Us"
                  className="w-full h-auto rounded-xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-white text-center" style={{ background: 'linear-gradient(135deg, #0A3D62 0%, #3C6382 100%)' }}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">هل أنت مستعد لبدء رحلتك القرآنية؟</h2>
            <p className="text-xl mb-8">انضم إلى آلاف الطلاب الذين بدؤوا رحلتهم معنا. سجل الآن وابدأ في تحفيظ القرآن الكريم.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth')}
                className="px-10 py-4 rounded-lg font-bold text-xl transition-all hover:transform hover:-translate-y-1"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                سجل مجاناً
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="px-10 py-4 rounded-lg font-bold text-xl transition-all hover:transform hover:-translate-y-1"
                style={{ backgroundColor: '#60A3BC', color: '#0A3D62' }}
              >
                تواصل معنا
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 text-center" style={{ backgroundColor: '#F5F6FA' }}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 relative inline-block" style={{ color: '#0A3D62' }}>
              تواصل معنا
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-20 h-1 rounded" style={{ backgroundColor: '#60A3BC' }}></div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-6" style={{ color: '#0A3D62' }}>معلومات الاتصال</h3>
                <ul className="space-y-4 text-right">
                  <li className="flex items-center gap-3">
                    <i className="fas fa-map-marker-alt text-2xl" style={{ color: '#3C6382' }}></i>
                    <span className="text-lg text-gray-700">العنوان: القاهرة، مصر</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-phone text-2xl" style={{ color: '#3C6382' }}></i>
                    <span className="text-lg text-gray-700">الهاتف: +20 123 456 7890</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="fas fa-envelope text-2xl" style={{ color: '#3C6382' }}></i>
                    <span className="text-lg text-gray-700">البريد الإلكتروني: info@almahirun.com</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold mb-6" style={{ color: '#0A3D62' }}>تابعنا على</h3>
                <ul className="space-y-4 text-right">
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-[#3C6382] transition-colors">
                      <i className="fab fa-facebook text-2xl"></i>
                      <span className="text-lg">فيسبوك</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-[#3C6382] transition-colors">
                      <i className="fab fa-twitter text-2xl"></i>
                      <span className="text-lg">تويتر</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-[#3C6382] transition-colors">
                      <i className="fab fa-instagram text-2xl"></i>
                      <span className="text-lg">انستجرام</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-[#3C6382] transition-colors">
                      <i className="fab fa-youtube text-2xl"></i>
                      <span className="text-lg">يوتيوب</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-white text-center" style={{ backgroundColor: '#2C3A47' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
              <div>
                <Link href="/" className="text-2xl font-bold text-white block mb-4">الماهرون</Link>
                <p className="text-gray-300">منصة تعليمية متخصصة في تحفيظ وتجويد القرآن الكريم عبر الإنترنت، على يد معلمين ومعلمات مجازين.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#60A3BC' }}>روابط سريعة</h3>
                <ul className="space-y-2">
                  <li><a href="#hero" className="text-gray-300 hover:text-white transition-colors">الرئيسية</a></li>
                  <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">المميزات</a></li>
                  <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">من نحن</a></li>
                  <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">تواصل معنا</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#60A3BC' }}>تواصل مباشر</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="mailto:info@almahirun.com" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                      <i className="fas fa-envelope"></i>
                      <span>info@almahirun.com</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                      <i className="fab fa-whatsapp"></i>
                      <span>واتساب</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                      <i className="fab fa-telegram"></i>
                      <span>تليجرام</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-600">
              <p className="text-gray-400">جميع الحقوق محفوظة © 2024 منصة الماهرون لتحفيظ القرآن الكريم</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
