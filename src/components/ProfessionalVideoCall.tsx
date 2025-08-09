'use client';

import React, { useEffect } from 'react';
import { useDirectVideoCall } from '@/hooks/useDirectVideoCall';
import IncomingCallScreen from './IncomingCallScreen';
import ActiveCallScreen from './ActiveCallScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video } from 'lucide-react';

interface ProfessionalVideoCallProps {
  userId: string;
  userType: 'student' | 'teacher';
  userName: string;
  // للطلاب: معلومات المعلم المراد الاتصال به
  targetTeacherId?: string;
  targetTeacherName?: string;
  targetTeacherImage?: string;
  // للمعلمين: معلومات إضافية
  currentSurah?: string;
}

export default function ProfessionalVideoCall({
  userId,
  userType,
  userName,
  targetTeacherId,
  targetTeacherName,
  targetTeacherImage,
  currentSurah = "سورة البقرة"
}: ProfessionalVideoCallProps) {
  
  const {
    isInCall,
    isConnecting,
    connectionState,
    callDuration,
    isVideoEnabled,
    isAudioEnabled,
    currentCall,
    incomingCalls,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    toggleVideo,
    toggleAudio,
    endCall
  } = useDirectVideoCall(userId, userType);

  // تحميل CSS الإسلامي
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/islamic-theme.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // عرض شاشة المكالمة النشطة
  if (isInCall && currentCall) {
    return (
      <ActiveCallScreen
        participantName={
          userType === 'student' 
            ? currentCall.teacherName 
            : currentCall.studentName
        }
        participantImage={targetTeacherImage}
        currentSurah={currentSurah}
        callDuration={callDuration}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onEndCall={endCall}
        onOpenQuran={() => {
          // فتح المصحف - يمكن تطويره لاحقاً
          window.open('https://quran.com', '_blank');
        }}
        onOpenChat={() => {
          // فتح الدردشة - يمكن تطويره لاحقاً
          console.log('Opening chat...');
        }}
        onRateTeacher={() => {
          // تقييم المعلم - يمكن تطويره لاحقاً
          console.log('Rating teacher...');
        }}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    );
  }

  // عرض شاشة المكالمة الواردة (للمعلمين)
  if (userType === 'teacher' && incomingCalls.length > 0) {
    const incomingCall = incomingCalls[0];
    
    return (
      <IncomingCallScreen
        callerName={incomingCall.studentName}
        callerImage={undefined} // يمكن إضافة صورة الطالب لاحقاً
        callerTitle="طالب تحفيظ القرآن الكريم"
        onAcceptAudio={() => acceptCall(incomingCall)}
        onAcceptVideo={() => acceptCall(incomingCall)}
        onReject={() => rejectCall(incomingCall)}
        isVisible={true}
      />
    );
  }

  // عرض حالة الاتصال (للطلاب)
  if (isConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center"
      >
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 border-4 border-white/30 border-t-white rounded-full"
          />
          
          <h2 className="text-2xl font-bold mb-2">جاري الاتصال...</h2>
          <p className="text-white/80">
            {userType === 'student' 
              ? `الاتصال بـ ${targetTeacherName}` 
              : 'قبول المكالمة...'
            }
          </p>
          
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              إلغاء
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // عرض أزرار المكالمة (للطلاب)
  if (userType === 'student' && targetTeacherId && targetTeacherName) {
    return (
      <div className="space-y-4">
        {/* زر مكالمة فيديو احترافي */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startCall(targetTeacherId, userName, targetTeacherName)}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
        >
          <Video className="w-6 h-6" />
          <span className="font-semibold text-lg">📹 مكالمة فيديو</span>
        </motion.button>

        {/* زر مكالمة صوتية */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startCall(targetTeacherId, userName, targetTeacherName)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
        >
          <Phone className="w-5 h-5" />
          <span className="font-semibold">📞 مكالمة صوتية</span>
        </motion.button>

        {/* معلومات المعلم */}
        {targetTeacherImage && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md">
            <img
              src={targetTeacherImage}
              alt={targetTeacherName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-800">{targetTeacherName}</h3>
              <p className="text-sm text-gray-600">معلم تحفيظ القرآن الكريم</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // عرض رسالة خطأ
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
      >
        <div className="text-red-600 text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </motion.div>
    );
  }

  // الحالة الافتراضية (للمعلمين بدون مكالمات)
  if (userType === 'teacher') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📞</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          في انتظار المكالمات
        </h3>
        <p className="text-gray-600">
          سيتم إشعارك عند وصول مكالمة جديدة من الطلاب
        </p>
        
        {/* مؤشر الحالة */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">متصل ومتاح</span>
        </div>
      </div>
    );
  }

  return null;
}
