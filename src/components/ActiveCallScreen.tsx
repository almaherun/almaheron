'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageCircle, 
  Star,
  BookOpen,
  MoreVertical,
  Maximize,
  Minimize
} from 'lucide-react';

interface ActiveCallScreenProps {
  participantName: string;
  participantImage?: string;
  currentSurah?: string;
  callDuration: number;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  onOpenQuran: () => void;
  onOpenChat: () => void;
  onRateTeacher: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

export default function ActiveCallScreen({
  participantName,
  participantImage,
  currentSurah = "سورة البقرة",
  callDuration,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  onOpenQuran,
  onOpenChat,
  onRateTeacher,
  localVideoRef,
  remoteVideoRef
}: ActiveCallScreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // تنسيق وقت المكالمة
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // إخفاء الأزرار تلقائياً
  const resetControlsTimeout = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    const timeout = setTimeout(() => setShowControls(false), 5000);
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🕌</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg">درس تحفيظ مباشر</h1>
                  <p className="text-sm text-white/70">أكاديمية المحرون</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📖</span>
                  <span className="font-semibold">{currentSurah}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>⏱️ {formatDuration(callDuration)}</span>
                </div>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Fallback when no video */}
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900/80">
            <div className="text-center text-white">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-white/20">
                {participantImage ? (
                  <img src={participantImage} alt={participantName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">{participantName}</h3>
              <p className="text-white/70">معلم تحفيظ القرآن الكريم</p>
            </div>
          </div>
        </div>

        {/* Local Video (Picture in Picture) */}
        <motion.div
          drag
          dragConstraints={{ left: 20, right: -150, top: 100, bottom: -150 }}
          className="absolute top-20 right-6 w-32 h-40 bg-gray-800 rounded-xl overflow-hidden shadow-2xl cursor-move"
          whileDrag={{ scale: 1.05 }}
        >
          <div className="w-full h-full bg-gray-700 flex items-center justify-center relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-center text-white">
                <div>
                  <VideoOff className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">الكاميرا مغلقة</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Local Video Controls Indicator */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            {!isAudioEnabled && (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {!isVideoEnabled && (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6"
          >
            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Mute Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleAudio}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isAudioEnabled 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </motion.button>

              {/* Video Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isVideoEnabled 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </motion.button>

              {/* End Call Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </motion.button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Quran Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenQuran}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-white" />
                <span className="text-white text-sm">📖 مصحف</span>
              </motion.button>

              {/* Chat Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenChat}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm">💬 دردشة</span>
              </motion.button>

              {/* Rate Teacher Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRateTeacher}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Star className="w-4 h-4 text-white" />
                <span className="text-white text-sm">⭐ تقييم</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap to show controls hint */}
      {!showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm"
        >
          اضغط لإظهار الأزرار
        </motion.div>
      )}
    </div>
  );
}
