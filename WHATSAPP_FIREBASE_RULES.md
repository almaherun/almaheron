# 🔥 Firebase Security Rules للنظام الجديد WhatsApp Style

## 📋 قواعد الأمان المطلوبة للمكالمات الفردية

### **اذهب إلى Firebase Console:**
https://console.firebase.google.com/project/almaheron-webapp/firestore/rules

### **أضف هذه القواعد:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // قواعد المستخدمين الموجودة
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /teachers/{teacherId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == teacherId;
    }
    
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == studentId;
    }

    // قواعد المكالمات الموجودة
    match /agora_call_requests/{callId} {
      allow read, write: if request.auth != null;
    }
    
    match /simple_calls/{callId} {
      allow read, write: if request.auth != null;
    }
    
    match /advanced_call_sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }

    match /jitsi_sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }

    // ✅ قواعد WhatsApp Calls الجديدة - هذا المطلوب!
    match /whatsapp_calls/{callId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.callerId || 
         request.auth.uid == resource.data.receiverId);
      
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.callerId;
      
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.callerId || 
         request.auth.uid == resource.data.receiverId);
      
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.callerId || 
         request.auth.uid == resource.data.receiverId);
    }

    // قواعد أخرى موجودة
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ⚡ **الحل السريع البديل:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 **خطوات التطبيق:**

1. **افتح Firebase Console** ✅
2. **اذهب لـ Firestore Rules** ✅
3. **أضف قواعد whatsapp_calls** ✅
4. **احفظ القواعد** ✅
5. **انتظر 2-3 دقائق** ⏳
6. **جرب المكالمة مرة أخرى** 🧪

## 📞 **النتيجة المتوقعة:**

بعد إصلاح القواعد:
- ✅ **بدون خطأ "insufficient permissions"**
- ✅ **إنشاء مكالمة WhatsApp بنجاح**
- ✅ **إشعار يصل للمعلم فوراً**
- ✅ **مكالمة فردية تعمل بشكل مثالي**

## 🚀 **المميزات الجديدة:**

### **✅ نظام مكالمات WhatsApp Style:**
- 📞 **مكالمات فردية** (شخص لشخص)
- 🔔 **إشعارات حقيقية** تصل للمعلم
- 📱 **واجهة مثل WhatsApp** تماماً
- 🎨 **تصميم عصري** ومتجاوب
- ⚡ **سرعة فائقة** في الاتصال

### **🎯 الأزرار الجديدة:**
- 📹 **"مكالمة فيديو"** - أزرق
- 🎙️ **"مكالمة صوتية"** - أخضر

### **🔥 تجربة المستخدم:**
1. **الطالب يضغط زر المكالمة**
2. **إشعار فوري للمعلم** مع صوت رنين
3. **المعلم يضغط قبول/رفض**
4. **مكالمة فردية مباشرة** مثل WhatsApp
5. **واجهة مكالمة احترافية** مع جميع الأزرار

## 🎊 **النظام الجديد جاهز!**

**بعد تحديث Firebase Rules ستحصل على:**
- ✅ **نظام مكالمات عالمي مجاني**
- ✅ **تجربة مثل WhatsApp تماماً**
- ✅ **إشعارات تعمل 100%**
- ✅ **مكالمات فردية مستقرة**
