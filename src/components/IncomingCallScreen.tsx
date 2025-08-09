'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Mic, MicOff } from 'lucide-react';

interface IncomingCallScreenProps {
  callerName: string;
  callerImage?: string;
  callerTitle?: string;
  onAcceptAudio: () => void;
  onAcceptVideo: () => void;
  onReject: () => void;
  isVisible: boolean;
}

export default function IncomingCallScreen({
  callerName,
  callerImage,
  callerTitle = "معلم تحفيظ القرآن الكريم",
  onAcceptAudio,
  onAcceptVideo,
  onReject,
  isVisible
}: IncomingCallScreenProps) {
  const [isRinging, setIsRinging] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // فحص حالة الإذن الحالية
  const checkPermissionStatus = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      console.log('🔍 Permission status:', {
        camera: permissions.state,
        microphone: micPermissions.state
      });

      if (permissions.state === 'granted' && micPermissions.state === 'granted') {
        console.log('✅ Permissions already granted');
        setPermissionGranted(true);
        setForceUpdate(prev => prev + 1);
        return true;
      }

      return false;
    } catch (error) {
      console.log('🔍 Permission API not supported, will use getUserMedia');
      return false;
    }
  };

  // طلب إذن الكاميرا والميكروفون
  const requestPermissions = async () => {
    console.log('🔍 Requesting permissions...');
    setIsRequestingPermission(true);

    try {
      // فحص الإذن أولاً
      const alreadyGranted = await checkPermissionStatus();
      if (alreadyGranted) {
        setIsRequestingPermission(false);
        return;
      }

      console.log('📱 Calling getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Stream received:', stream);

      // إيقاف المسارات فوراً (نحن نريد الإذن فقط)
      stream.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track.kind);
        track.stop();
      });

      console.log('✅ Setting permissionGranted to true');
      setPermissionGranted(true);
      setForceUpdate(prev => prev + 1); // إجبار إعادة الرسم
      console.log('✅ Camera and microphone permissions granted');

      // إضافة تأكيد بصري
      setTimeout(() => {
        alert('✅ تم منح الإذن بنجاح! يمكنك الآن قبول المكالمة.');
      }, 500);

    } catch (error) {
      console.error('❌ Permission denied:', error);
      alert('❌ يرجى السماح للكاميرا والميكروفون في المتصفح للمتابعة');
    } finally {
      console.log('🔍 Setting isRequestingPermission to false');
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      // إعادة تعيين حالة الإذن عند ظهور المكالمة الجديدة
      setPermissionGranted(false);
      setIsRequestingPermission(false);

      // فحص الإذن عند ظهور المكالمة
      checkPermissionStatus();

      // فحص دوري للإذن كل ثانية
      const permissionInterval = setInterval(async () => {
        if (!permissionGranted) {
          await checkPermissionStatus();
        }
      }, 1000);

      // تشغيل صوت الرنين (اختياري)
      const audio = new Audio('/sounds/quran-ringtone.mp3');
      audio.loop = true;
      audio.play().catch(() => {
        // تجاهل الخطأ إذا لم يُسمح بتشغيل الصوت
      });

      return () => {
        clearInterval(permissionInterval);
        audio.pause();
        audio.currentTime = 0;
      };
    }

    return () => {
      // تنظيف عند عدم الرؤية
    };
  }, [isVisible, permissionGranted]);

  // مراقبة تغيير حالة الإذن
  useEffect(() => {
    console.log('🔍 Permission state changed:', {
      permissionGranted,
      isRequestingPermission,
      forceUpdate
    });
  }, [permissionGranted, isRequestingPermission, forceUpdate]);

  // تشخيص الحالة
  console.log('🔍 IncomingCallScreen state:', {
    isVisible,
    permissionGranted,
    isRequestingPermission,
    callerName
  });

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 call-overlay flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(76, 175, 80, 0.9) 100%)'
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🕌</span>
            </div>
            <h1 className="text-white text-xl font-bold">أكاديمية المحرون للقرآن</h1>
          </div>
          <p className="text-white/80 text-sm">مكالمة فيديو واردة</p>
        </motion.div>

        {/* Caller Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8"
        >
          <div className={`w-40 h-40 rounded-full overflow-hidden shadow-2xl ${isRinging ? 'animate-pulse-islamic' : ''}`}>
            {callerImage ? (
              <img
                src={callerImage}
                alt={callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-6xl">👤</span>
              </div>
            )}
          </div>
          
          {/* Ringing Animation */}
          {isRinging && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full border-4 border-white/50"
            />
          )}
        </motion.div>

        {/* Caller Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-white text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">📖</span>
            {callerName}
          </h2>
          <p className="text-white/80 text-lg">{callerTitle}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/70 text-sm">متصل الآن</span>
          </div>
        </motion.div>

        {/* Permission Status */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          {!permissionGranted ? (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-red-500/30">
              <p className="text-white/90 text-sm mb-3">
                🎥 يرجى السماح للكاميرا والميكروفون للمتابعة
              </p>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={requestPermissions}
                  disabled={isRequestingPermission}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isRequestingPermission ? '⏳ جاري الطلب...' : '🔓 السماح للكاميرا'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={checkPermissionStatus}
                  className="w-full px-4 py-1 bg-blue-600/50 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  🔄 فحص الإذن مرة أخرى
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-green-500/30">
              <p className="text-white/90 text-sm mb-2">
                ✅ تم منح الإذن بنجاح!
              </p>
              <p className="text-white/70 text-xs">
                يمكنك الآن قبول المكالمة
              </p>
            </div>
          )}
        </motion.div>

        {/* Call Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-8"
        >
          {/* Reject Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </motion.button>

          {/* Accept Audio Button */}
          <motion.button
            whileHover={{ scale: permissionGranted ? 1.1 : 1 }}
            whileTap={{ scale: permissionGranted ? 0.95 : 1 }}
            onClick={permissionGranted ? onAcceptAudio : requestPermissions}
            disabled={!permissionGranted}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              permissionGranted
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Phone className="w-8 h-8 text-white" />
          </motion.button>

          {/* Accept Video Button */}
          <motion.button
            whileHover={{ scale: permissionGranted ? 1.1 : 1 }}
            whileTap={{ scale: permissionGranted ? 0.95 : 1 }}
            onClick={permissionGranted ? onAcceptVideo : requestPermissions}
            disabled={!permissionGranted}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              permissionGranted
                ? 'bg-green-500 hover:bg-green-600 glow-islamic'
                : 'bg-gray-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Video className="w-8 h-8 text-white" />
          </motion.button>
        </motion.div>

        {/* Action Labels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-8 mt-4"
        >
          <span className="text-white/60 text-sm w-16 text-center">رفض</span>
          <span className={`text-sm w-16 text-center ${permissionGranted ? 'text-white/60' : 'text-gray-400'}`}>
            {permissionGranted ? 'صوتي' : 'مقفل'}
          </span>
          <span className={`text-sm w-16 text-center ${permissionGranted ? 'text-white/60' : 'text-gray-400'}`}>
            {permissionGranted ? 'فيديو' : 'مقفل'}
          </span>
        </motion.div>

        {/* Islamic Pattern Decoration */}
        <div className="absolute top-8 left-8 w-16 h-16 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white">
            <path
              d="M50 10 L90 50 L50 90 L10 50 Z"
              fill="currentColor"
              className="animate-spin"
              style={{ animationDuration: '20s' }}
            />
          </svg>
        </div>

        <div className="absolute bottom-8 right-8 w-12 h-12 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M50 20 L60 40 L50 50 L40 40 Z" fill="currentColor" />
          </svg>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
