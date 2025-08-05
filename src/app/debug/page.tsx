'use client';

import React, { useState, useEffect } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // تسجيل جميع الأخطاء
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')]);
      originalError(...args);
    };

    console.warn = (...args) => {
      setLogs(prev => [...prev, `⚠️ ${args.join(' ')}`]);
      originalWarn(...args);
    };

    console.log = (...args) => {
      setLogs(prev => [...prev, `ℹ️ ${args.join(' ')}`]);
      originalLog(...args);
    };

    // تسجيل معلومات البيئة
    setLogs(prev => [...prev, `🌍 Environment: ${process.env.NODE_ENV}`]);
    setLogs(prev => [...prev, `🔥 Firebase API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'موجود' : 'مفقود'}`]);
    setLogs(prev => [...prev, `🔥 Firebase Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'مفقود'}`]);
    setLogs(prev => [...prev, `☁️ Cloudinary: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'موجود' : 'مفقود'}`]);

    // تسجيل معلومات المتصفح
    setLogs(prev => [...prev, `🌐 User Agent: ${navigator.userAgent}`]);
    setLogs(prev => [...prev, `📱 Screen: ${window.screen.width}x${window.screen.height}`]);
    setLogs(prev => [...prev, `🕐 Current Time: ${new Date().toLocaleString('ar-SA')}`]);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  const testFirebase = async () => {
    try {
      setLogs(prev => [...prev, '🔥 اختبار Firebase...']);
      const { auth } = await import('@/lib/firebase');
      setLogs(prev => [...prev, '✅ Firebase Auth تم تحميله بنجاح']);
      
      const { db } = await import('@/lib/firebase');
      setLogs(prev => [...prev, '✅ Firestore تم تحميله بنجاح']);
    } catch (error) {
      setErrors(prev => [...prev, `❌ خطأ في Firebase: ${error}`]);
    }
  };

  const testAuthContext = async () => {
    try {
      setLogs(prev => [...prev, '🔐 اختبار AuthContext...']);
      const { useAuth } = await import('@/contexts/AuthContext');
      setLogs(prev => [...prev, '✅ AuthContext تم تحميله بنجاح']);
    } catch (error) {
      setErrors(prev => [...prev, `❌ خطأ في AuthContext: ${error}`]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#00ff00', marginBottom: '20px' }}>🔍 صفحة التشخيص - Al Maheron Academy</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testFirebase}
          style={{ 
            backgroundColor: '#ff6b35', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          اختبار Firebase
        </button>
        
        <button 
          onClick={testAuthContext}
          style={{ 
            backgroundColor: '#4ecdc4', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          اختبار AuthContext
        </button>

        <button 
          onClick={() => window.location.reload()}
          style={{ 
            backgroundColor: '#45b7d1', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          تحديث الصفحة
        </button>
      </div>

      {errors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#ff4757' }}>❌ الأخطاء:</h2>
          <div style={{ backgroundColor: '#2d1b1b', padding: '10px', borderRadius: '5px', maxHeight: '200px', overflow: 'auto' }}>
            {errors.map((error, index) => (
              <div key={index} style={{ marginBottom: '5px', color: '#ff6b6b' }}>
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ color: '#5dade2' }}>📋 السجلات:</h2>
        <div style={{ backgroundColor: '#2c3e50', padding: '10px', borderRadius: '5px', maxHeight: '400px', overflow: 'auto' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', color: '#ecf0f1' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#34495e', borderRadius: '5px' }}>
        <h3 style={{ color: '#f39c12' }}>🔗 روابط مفيدة:</h3>
        <ul>
          <li><a href="/" style={{ color: '#3498db' }}>الصفحة الرئيسية</a></li>
          <li><a href="/test" style={{ color: '#3498db' }}>صفحة الاختبار</a></li>
          <li><a href="/auth" style={{ color: '#3498db' }}>صفحة تسجيل الدخول</a></li>
        </ul>
      </div>
    </div>
  );
}
