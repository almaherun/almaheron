'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useUserData } from '@/hooks/useUser';

interface CallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  status: string;
  callType: string;
  createdAt: any;
  expiresAt: any;
  senderId?: string;
  senderName?: string;
  senderType?: string;
}

interface DiagnosticInfo {
  currentUser: any;
  userData: any;
  authState: string;
  callSystemStatus: string;
  firebaseConnection: string;
  lastUpdate: string;
}

export default function CallDebugPage() {
  const { userData, loading } = useUserData();
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [allCalls, setAllCalls] = useState<CallRequest[]>([]);
  const [myCalls, setMyCalls] = useState<CallRequest[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // تشخيص شامل للنظام
  const runDiagnostics = async () => {
    setIsRefreshing(true);
    const newErrors: string[] = [];
    
    try {
      // فحص Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        newErrors.push('❌ المستخدم غير مسجل دخول في Firebase Auth');
      }

      // فحص بيانات المستخدم
      if (!userData) {
        newErrors.push('❌ لا يمكن تحميل بيانات المستخدم من useUserData');
      }

      // فحص تطابق المعرفات
      if (currentUser && userData) {
        if (currentUser.uid !== userData.id) {
          newErrors.push(`⚠️ عدم تطابق المعرفات: Auth UID (${currentUser.uid}) ≠ UserData ID (${userData.id})`);
        }
      }

      // إعداد معلومات التشخيص
      const diagnosticInfo: DiagnosticInfo = {
        currentUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        } : null,
        userData: userData ? {
          id: userData.id,
          name: userData.name,
          type: userData.type,
          email: userData.email
        } : null,
        authState: currentUser ? 'متصل' : 'غير متصل',
        callSystemStatus: 'جاري الفحص...',
        firebaseConnection: 'متصل',
        lastUpdate: new Date().toLocaleString('ar-EG')
      };

      setDiagnostics(diagnosticInfo);
      setErrors(newErrors);

    } catch (error) {
      newErrors.push(`❌ خطأ في التشخيص: ${error}`);
      setErrors(newErrors);
    }
    
    setIsRefreshing(false);
  };

  // جلب جميع المكالمات
  useEffect(() => {
    const unsubscribeAll = onSnapshot(
      query(collection(db, 'agora_call_requests'), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => {
        const calls: CallRequest[] = [];
        snapshot.forEach((doc) => {
          calls.push({ id: doc.id, ...doc.data() } as CallRequest);
        });
        setAllCalls(calls);
      },
      (error) => {
        setErrors(prev => [...prev, `❌ خطأ في جلب المكالمات: ${error.message}`]);
      }
    );

    return () => unsubscribeAll();
  }, []);

  // جلب مكالماتي فقط
  useEffect(() => {
    if (!userData) return;

    const fieldToQuery = userData.type === 'teacher' ? 'teacherId' : 'studentId';
    const unsubscribeMy = onSnapshot(
      query(
        collection(db, 'agora_call_requests'),
        where(fieldToQuery, '==', userData.id),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        const calls: CallRequest[] = [];
        snapshot.forEach((doc) => {
          calls.push({ id: doc.id, ...doc.data() } as CallRequest);
        });
        setMyCalls(calls);
      },
      (error) => {
        setErrors(prev => [...prev, `❌ خطأ في جلب مكالماتي: ${error.message}`]);
      }
    );

    return () => unsubscribeMy();
  }, [userData]);

  // تشخيص تلقائي عند التحميل
  useEffect(() => {
    if (!loading) {
      runDiagnostics();
    }
  }, [loading, userData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'accepted': return 'مقبولة';
      case 'rejected': return 'مرفوضة';
      case 'expired': return 'منتهية الصلاحية';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل صفحة التشخيص...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔧 تشخيص نظام المكالمات</h1>
          <p className="text-muted-foreground">صفحة شاملة لتشخيص جميع مشاكل المكالمات</p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث التشخيص
        </Button>
      </div>

      {/* معلومات التشخيص */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            معلومات التشخيص
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">🔐 Firebase Auth:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>الحالة:</strong> {diagnostics.authState}</p>
                  {diagnostics.currentUser && (
                    <>
                      <p><strong>UID:</strong> {diagnostics.currentUser.uid}</p>
                      <p><strong>البريد:</strong> {diagnostics.currentUser.email}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">👤 بيانات المستخدم:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {diagnostics.userData ? (
                    <>
                      <p><strong>ID:</strong> {diagnostics.userData.id}</p>
                      <p><strong>الاسم:</strong> {diagnostics.userData.name}</p>
                      <p><strong>النوع:</strong> {diagnostics.userData.type}</p>
                    </>
                  ) : (
                    <p className="text-red-500">لا توجد بيانات</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground">
              آخر تحديث: {diagnostics?.lastUpdate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* الأخطاء */}
      {errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              الأخطاء المكتشفة ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* مكالماتي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            مكالماتي ({myCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myCalls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد مكالمات</p>
          ) : (
            <div className="space-y-3">
              {myCalls.map((call) => (
                <div key={call.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(call.status)}>
                        {getStatusText(call.status)}
                      </Badge>
                      <Badge variant="outline">{call.callType}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {call.createdAt?.toDate?.()?.toLocaleString('ar-EG') || 'غير محدد'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>من:</strong> {call.senderName || call.studentName}</p>
                    <p><strong>إلى:</strong> {call.teacherName}</p>
                    <p><strong>Student ID:</strong> {call.studentId}</p>
                    <p><strong>Teacher ID:</strong> {call.teacherId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* جميع المكالمات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            جميع المكالمات الأخيرة ({allCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allCalls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد مكالمات في النظام</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allCalls.map((call) => (
                <div key={call.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(call.status)}>
                        {getStatusText(call.status)}
                      </Badge>
                      <Badge variant="outline">{call.callType}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {call.createdAt?.toDate?.()?.toLocaleString('ar-EG') || 'غير محدد'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>من:</strong> {call.senderName || call.studentName}</p>
                    <p><strong>إلى:</strong> {call.teacherName}</p>
                    <p><strong>Student ID:</strong> {call.studentId}</p>
                    <p><strong>Teacher ID:</strong> {call.teacherId}</p>
                    <p><strong>Call ID:</strong> {call.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
