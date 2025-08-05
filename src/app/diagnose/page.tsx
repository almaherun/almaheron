'use client';

import { useEffect, useState } from 'react';

export default function DiagnosePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [authState, setAuthState] = useState('unknown');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('🚀 Component mounted');
    setMounted(true);

    // مراقبة تغييرات الـ URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      addLog(`🔄 Navigation: pushState to ${args[2]}`);
      return originalPushState.apply(history, args);
    };

    history.replaceState = function(...args) {
      addLog(`🔄 Navigation: replaceState to ${args[2]}`);
      return originalReplaceState.apply(history, args);
    };

    // مراقبة الأخطاء
    const errorHandler = (event: ErrorEvent) => {
      addLog(`❌ Error: ${event.message} at ${event.filename}:${event.lineno}`);
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      addLog(`❌ Unhandled Promise Rejection: ${event.reason}`);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    // اختبار Firebase
    const testFirebase = async () => {
      try {
        addLog('🔥 Testing Firebase...');
        const { auth } = await import('@/lib/firebase');
        if (auth) {
          addLog('✅ Firebase Auth loaded successfully');
          
          // مراقبة تغييرات المصادقة
          const { onAuthStateChanged } = await import('firebase/auth');
          onAuthStateChanged(auth, (user) => {
            if (user) {
              addLog(`👤 User logged in: ${user.email}`);
              setAuthState('logged-in');
            } else {
              addLog('👤 No user logged in');
              setAuthState('logged-out');
            }
          });
        } else {
          addLog('❌ Firebase Auth is null');
        }
      } catch (error) {
        addLog(`❌ Firebase error: ${error}`);
      }
    };

    // اختبار AuthContext
    const testAuthContext = async () => {
      try {
        addLog('🔐 Testing AuthContext...');
        const { useAuth } = await import('@/contexts/AuthContext');
        addLog('✅ AuthContext imported successfully');
      } catch (error) {
        addLog(`❌ AuthContext error: ${error}`);
      }
    };

    testFirebase();
    testAuthContext();

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // مراقبة إعادة الرندر
  useEffect(() => {
    addLog('🔄 Component re-rendered');
  });

  const testNavigation = () => {
    addLog('🧪 Testing navigation to /');
    window.location.href = '/';
  };

  const testAuthRedirect = () => {
    addLog('🧪 Testing navigation to /auth');
    window.location.href = '/auth';
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#000', 
      color: '#00ff00', 
      minHeight: '100vh',
      fontSize: '14px'
    }}>
      <h1 style={{ color: '#ff6b35', marginBottom: '20px' }}>
        🔍 تشخيص متقدم - Al Maheron Academy
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
        <h3 style={{ color: '#4ecdc4' }}>📊 معلومات الحالة:</h3>
        <p>🏗️ Component Mounted: {mounted ? '✅' : '❌'}</p>
        <p>🔐 Auth State: {authState}</p>
        <p>🌐 Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        <p>📱 User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testNavigation}
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
          اختبار الانتقال للرئيسية
        </button>
        
        <button 
          onClick={testAuthRedirect}
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
          اختبار الانتقال للمصادقة
        </button>

        <button 
          onClick={clearLogs}
          style={{ 
            backgroundColor: '#45b7d1', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          مسح السجلات
        </button>
      </div>

      <div>
        <h3 style={{ color: '#f39c12' }}>📋 سجل الأحداث:</h3>
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '15px', 
          borderRadius: '5px', 
          maxHeight: '400px', 
          overflow: 'auto',
          border: '1px solid #333'
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#666' }}>لا توجد أحداث بعد...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                color: log.includes('❌') ? '#ff6b6b' : 
                      log.includes('✅') ? '#51cf66' : 
                      log.includes('🔄') ? '#ffd43b' : '#ecf0f1'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
