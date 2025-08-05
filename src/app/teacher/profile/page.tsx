
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, User, BookOpen, Clock } from 'lucide-react';

export default function TeacherProfile() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    experience: '',
    specialization: '',
    bio: '',
    availableHours: '',
    hourlyRate: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        experience: userProfile.experience || '',
        specialization: userProfile.specialization || '',
        bio: userProfile.bio || '',
        availableHours: userProfile.availableHours || '',
        hourlyRate: userProfile.hourlyRate?.toString() || ''
      });
    }
  }, [userProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة صحيحة",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            folder: 'avatars'
          }),
        });

        if (!response.ok) {
          throw new Error('فشل في رفع الصورة');
        }

        const { url } = await response.json();

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          photoURL: url,
          updatedAt: new Date()
        });

        await refreshUserProfile();

        toast({
          title: "تم بنجاح",
          description: "تم تحديث صورة الملف الشخصي"
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        experience: formData.experience,
        specialization: formData.specialization,
        bio: formData.bio,
        availableHours: formData.availableHours,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        updatedAt: new Date()
      });

      await refreshUserProfile();

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الملف الشخصي"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملف الشخصي",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            الملف الشخصي للمعلم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* صورة الملف الشخصي */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.photoURL || ''} />
                <AvatarFallback>
                  {userProfile.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && <p className="text-sm text-gray-600">جاري رفع الصورة...</p>}
          </div>

          {/* نموذج البيانات */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">الاسم الكامل</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="أدخل رقم هاتفك"
                />
              </div>

              <div>
                <Label htmlFor="experience">سنوات الخبرة</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="مثال: 5 سنوات"
                />
              </div>

              <div>
                <Label htmlFor="specialization">التخصص</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="مثال: تحفيظ القرآن، التجويد"
                />
              </div>

              <div>
                <Label htmlFor="availableHours">الساعات المتاحة</Label>
                <Input
                  id="availableHours"
                  value={formData.availableHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableHours: e.target.value }))}
                  placeholder="مثال: 9 صباح<|im_start|> - 5 مساء"
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate">السعر بالساعة (ريال)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="مثال: 50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">نبذة عنك</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="اكتب نبذة عن خبرتك وأسلوب التدريس..."
                className="w-full p-3 border rounded-md resize-none h-24"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
