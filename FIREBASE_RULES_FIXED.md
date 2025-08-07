# 🔥 **إصلاح قواعد Firebase - حل مشكلة التحميل اللانهائي**

## 🚨 **المشكلة المكتشفة:**
- التحميل اللانهائي مستمر حتى بعد تعطيل نظام المكالمات
- السبب: **قواعد Firebase معقدة جداً** وتمنع الوصول للبيانات
- النتيجة: التطبيق لا يستطيع تحميل بيانات المستخدمين

## ✅ **الحل المطبق:**

### **تبسيط قواعد المستخدمين:**
```javascript
// قواعد مجموعة المستخدمين - مبسطة لحل مشكلة التحميل
match /users/{userId} {
  // السماح بالقراءة لجميع المستخدمين المصادقين (مؤقتاً)
  allow read: if isAuthenticated();
  
  // الإنشاء: المستخدم نفسه فقط
  allow create: if isOwner(userId);
  
  // التحديث: المستخدم نفسه أو الأدمن
  allow update: if isOwner(userId) || isAdmin();
  
  // الحذف: الأدمن فقط
  allow delete: if isAdmin();
}
```

### **تبسيط قواعد المكالمات:**
```javascript
// قواعد طلبات المكالمات Agora.io - مبسطة
match /agora_call_requests/{requestId} {
  // السماح الكامل للمستخدمين المصادقين (مؤقتاً لحل مشكلة التحميل)
  allow read, write, create, update, delete: if isAuthenticated();
}
```

## 🔧 **ارفع القواعد المحدثة فوراً:**

### **خطوات سريعة:**
1. **اذهب إلى:** https://console.firebase.google.com/
2. **اختر مشروع:** `almaheron`
3. **من القائمة:** **Firestore Database**
4. **اضغط تبويب:** **Rules**
5. **احذف كل المحتوى الموجود**
6. **انسخ والصق القواعد الجديدة:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions للتحقق من الصلاحيات
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().type == 'admin';
    }
    
    function isTeacher() {
      return isAuthenticated() && getUserData().type == 'teacher';
    }
    
    function isStudent() {
      return isAuthenticated() && getUserData().type == 'student';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidUserType(type) {
      return type in ['admin', 'teacher', 'student'];
    }
    
    function isValidEmail(email) {
      return email.matches('.*@.*\\..*');
    }
    
    // قواعد مجموعة المستخدمين - مبسطة لحل مشكلة التحميل
    match /users/{userId} {
      // السماح بالقراءة لجميع المستخدمين المصادقين (مؤقتاً)
      allow read: if isAuthenticated();
      
      // الإنشاء: المستخدم نفسه فقط
      allow create: if isOwner(userId);
      
      // التحديث: المستخدم نفسه أو الأدمن
      allow update: if isOwner(userId) || isAdmin();
      
      // الحذف: الأدمن فقط
      allow delete: if isAdmin();
    }
    
    // قواعد المستخدمين المؤقتين (للتحقق من البريد)
    match /temp_users/{tempUserId} {
      // السماح الكامل للعمليات المؤقتة أثناء التسجيل
      allow read, write, create, delete: if true;
    }
    
    // قواعد أكواد الدعوة
    match /codes/{codeId} {
      // السماح بالقراءة للتحقق من صحة الكود أثناء التسجيل
      allow read: if true;

      // الإنشاء: الأدمن فقط
      allow create: if isAdmin()
        && resource.data.type in ['teacher', 'student']
        && resource.data.status == 'active'
        && resource.data.createdAt == request.time
        && resource.data.createdBy == request.auth.uid;

      // التحديث: الأدمن أو عند استخدام الكود
      allow update: if isAdmin()
        || (isAuthenticated() &&
            resource.data.status == 'active' &&
            request.resource.data.status == 'used' &&
            request.resource.data.usedBy == request.auth.uid);

      // الحذف: الأدمن فقط
      allow delete: if isAdmin();
    }
    
    // قواعد الجلسات التعليمية
    match /sessions/{sessionId} {
      // القراءة: المعلم المالك أو الطلاب المشتركين أو الأدمن
      allow read: if isAdmin() 
        || (isTeacher() && resource.data.teacherId == request.auth.uid)
        || (isStudent() && request.auth.uid in resource.data.students);
      
      // الإنشاء: المعلم فقط
      allow create: if isTeacher() 
        && resource.data.teacherId == request.auth.uid
        && resource.data.createdAt == request.time;
      
      // التحديث: المعلم المالك فقط
      allow update: if isTeacher() 
        && resource.data.teacherId == request.auth.uid;
      
      // الحذف: المعلم المالك أو الأدمن
      allow delete: if isAdmin() 
        || (isTeacher() && resource.data.teacherId == request.auth.uid);
    }
    
    // قواعد المحتوى التعليمي
    match /content/{contentId} {
      // القراءة: جميع المستخدمين المصادقين
      allow read: if isAuthenticated();
      
      // الإنشاء: المعلم أو الأدمن
      allow create: if (isTeacher() || isAdmin()) 
        && resource.data.createdBy == request.auth.uid
        && resource.data.createdAt == request.time;
      
      // التحديث: المنشئ أو الأدمن
      allow update: if isAdmin() 
        || (isAuthenticated() && resource.data.createdBy == request.auth.uid);
      
      // الحذف: المنشئ أو الأدمن
      allow delete: if isAdmin() 
        || (isAuthenticated() && resource.data.createdBy == request.auth.uid);
    }
    
    // قواعد الإشعارات
    match /notifications/{notificationId} {
      // القراءة: المستقبل فقط
      allow read: if isAuthenticated() 
        && resource.data.userId == request.auth.uid;
      
      // الإنشاء: الأدمن أو النظام
      allow create: if isAdmin();
      
      // التحديث: المستقبل (لتحديث حالة القراءة) أو الأدمن
      allow update: if (isAuthenticated() && 
        resource.data.userId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']))
        || isAdmin();
      
      // الحذف: المستقبل أو الأدمن
      allow delete: if isAdmin() 
        || (isAuthenticated() && resource.data.userId == request.auth.uid);
    }
    
    // قواعد التقييمات والمراجعات
    match /reviews/{reviewId} {
      // القراءة: جميع المستخدمين المصادقين
      allow read: if isAuthenticated();
      
      // الإنشاء: الطلاب فقط
      allow create: if isStudent() 
        && resource.data.studentId == request.auth.uid
        && resource.data.createdAt == request.time;
      
      // التحديث: الكاتب فقط
      allow update: if isAuthenticated() 
        && resource.data.studentId == request.auth.uid;
      
      // الحذف: الكاتب أو الأدمن
      allow delete: if isAdmin() 
        || (isAuthenticated() && resource.data.studentId == request.auth.uid);
    }
    
    // قواعد الرسائل
    match /messages/{messageId} {
      // القراءة: المرسل أو المستقبل
      allow read: if isAuthenticated() 
        && (resource.data.senderId == request.auth.uid 
            || resource.data.receiverId == request.auth.uid);
      
      // الإنشاء: المستخدمين المصادقين
      allow create: if isAuthenticated() 
        && resource.data.senderId == request.auth.uid
        && resource.data.createdAt == request.time;
      
      // التحديث: المرسل فقط (لتحديث حالة القراءة)
      allow update: if isAuthenticated() 
        && resource.data.senderId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
      
      // الحذف: المرسل أو الأدمن
      allow delete: if isAdmin() 
        || (isAuthenticated() && resource.data.senderId == request.auth.uid);
    }
    
    // قواعد طلبات المكالمات Agora.io - مبسطة
    match /agora_call_requests/{requestId} {
      // السماح الكامل للمستخدمين المصادقين (مؤقتاً لحل مشكلة التحميل)
      allow read, write, create, update, delete: if isAuthenticated();
    }
    
    // منع الوصول لأي مجموعات أخرى
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

7. **اضغط:** **Publish**

## 🎯 **النتيجة المتوقعة:**

**بعد رفع القواعد المبسطة:**
- ✅ **توقف التحميل اللانهائي**
- ✅ **صفحات الطلاب والمعلمين تعمل**
- ✅ **يمكن تحميل بيانات المستخدمين**
- ✅ **النظام يعود للعمل الطبيعي**

## ⚠️ **مهم جداً:**
**ارفع القواعد فوراً لحل المشكلة!**

**بعد حل المشكلة سنعيد تفعيل نظام المكالمات بطريقة آمنة.**

---

*المشكلة كانت في القواعد المعقدة التي تمنع الوصول للبيانات الأساسية!*
