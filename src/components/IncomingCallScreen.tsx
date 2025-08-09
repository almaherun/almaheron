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

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      // تشغيل صوت الرنين (اختياري)
      const audio = new Audio('/sounds/quran-ringtone.mp3');
      audio.loop = true;
      audio.play().catch(() => {
        // تجاهل الخطأ إذا لم يُسمح بتشغيل الصوت
      });

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }

    return () => {
      // تنظيف عند عدم الرؤية
    };
  }, [isVisible]);

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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAcceptAudio}
            className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
          >
            <Phone className="w-8 h-8 text-white" />
          </motion.button>

          {/* Accept Video Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAcceptVideo}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors glow-islamic"
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
          <span className="text-white/60 text-sm w-16 text-center">صوتي</span>
          <span className="text-white/60 text-sm w-16 text-center">فيديو</span>
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
