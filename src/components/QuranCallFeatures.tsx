'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen, Volume2, VolumeX, Play, Pause, RotateCcw,
  PenTool, Eraser, Palette, Type, Star, Award,
  Mic, Square, Download, Share, Eye, EyeOff,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Circle
} from 'lucide-react';

interface QuranCallFeaturesProps {
  isHost: boolean;
  studentId?: string;
  onRatingChange?: (rating: number) => void;
}

export default function QuranCallFeatures({ 
  isHost, 
  studentId,
  onRatingChange 
}: QuranCallFeaturesProps) {
  // حالات المصحف
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [zoomLevel, setZoomLevel] = useState([100]);
  const [isRecitationPlaying, setIsRecitationPlaying] = useState(false);
  const [recitationSpeed, setRecitationSpeed] = useState([1]);

  // حالات الرسم والتعليق
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser' | 'text'>('pen');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState([3]);

  // حالات التقييم
  const [studentRating, setStudentRating] = useState(0);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [isRecordingRecitation, setIsRecordingRecitation] = useState(false);

  // مراجع العناصر
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // قائمة السور
  const surahs = [
    { id: 1, name: 'الفاتحة', ayahs: 7 },
    { id: 2, name: 'البقرة', ayahs: 286 },
    { id: 3, name: 'آل عمران', ayahs: 200 },
    // ... باقي السور
  ];

  // ألوان الرسم
  const drawingColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#000000', '#ffffff'
  ];

  // وظائف المصحف
  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < 604) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSurahChange = (surahId: number) => {
    setCurrentSurah(surahId);
    setCurrentAyah(1);
    // تحديث الصفحة حسب السورة
  };

  // وظائف التلاوة
  const toggleRecitation = () => {
    if (audioRef.current) {
      if (isRecitationPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsRecitationPlaying(!isRecitationPlaying);
    }
  };

  const handleRecitationSpeed = (speed: number[]) => {
    setRecitationSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed[0];
    }
  };

  // وظائف الرسم
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
  };

  const clearDrawing = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // وظائف التقييم
  const handleRating = (rating: number) => {
    setStudentRating(rating);
    onRatingChange?.(rating);
  };

  const saveSession = () => {
    const sessionData = {
      studentId,
      surah: currentSurah,
      ayah: currentAyah,
      rating: studentRating,
      notes: teacherNotes,
      timestamp: new Date()
    };
    
    console.log('💾 Session saved:', sessionData);
    // حفظ في قاعدة البيانات
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* عرض المصحف */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6" />
            <h3 className="text-lg font-semibold">المصحف الشريف</h3>
            <Badge variant="secondary">
              صفحة {currentPage} من 604
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel([Math.max(50, zoomLevel[0] - 10)])}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm">{zoomLevel[0]}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel([Math.min(200, zoomLevel[0] + 10)])}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-96 bg-gray-50">
          {/* صورة المصحف */}
          <div 
            className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center relative"
            style={{ transform: `scale(${zoomLevel[0] / 100})` }}
          >
            <div className="text-center p-8">
              <div className="text-2xl font-arabic mb-4 leading-relaxed">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <div className="text-xl font-arabic leading-loose">
                الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
              </div>
              <div className="text-xl font-arabic leading-loose">
                الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <div className="text-xl font-arabic leading-loose">
                مَالِكِ يَوْمِ الدِّينِ
              </div>
            </div>
          </div>

          {/* طبقة الرسم */}
          {isDrawingMode && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              width={800}
              height={600}
              onMouseDown={startDrawing}
            />
          )}
        </div>

        {/* تحكم المصحف */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>
            
            <select 
              value={currentSurah}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="px-3 py-1 border rounded text-sm"
            >
              {surahs.slice(0, 5).map(surah => (
                <option key={surah.id} value={surah.id}>
                  {surah.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={currentPage === 604}
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              آية {currentAyah} من {surahs.find(s => s.id === currentSurah)?.ayahs}
            </span>
          </div>
        </div>
      </div>

      {/* لوحة التحكم الجانبية */}
      <div className="space-y-4">
        {/* تحكم التلاوة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              التلاوة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={isRecitationPlaying ? "default" : "outline"}
                size="sm"
                onClick={toggleRecitation}
              >
                {isRecitationPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={isRecordingRecitation ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsRecordingRecitation(!isRecordingRecitation)}
              >
                {isRecordingRecitation ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">سرعة التلاوة</label>
              <Slider
                value={recitationSpeed}
                onValueChange={handleRecitationSpeed}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {recitationSpeed[0]}x
              </div>
            </div>

            <audio ref={audioRef} preload="metadata">
              <source src="/audio/quran/001.mp3" type="audio/mpeg" />
            </audio>
          </CardContent>
        </Card>

        {/* أدوات الرسم */}
        {isHost && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                أدوات التعليق
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isDrawingMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                >
                  {isDrawingMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDrawing}
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </div>

              {isDrawingMode && (
                <>
                  <div className="grid grid-cols-4 gap-1">
                    {drawingColors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${
                          selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">حجم الفرشاة</label>
                    <Slider
                      value={brushSize}
                      onValueChange={setBrushSize}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* تقييم الطالب */}
        {isHost && studentId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                تقييم الطالب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`w-8 h-8 ${
                      star <= studentRating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="ملاحظات المعلم..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                className="min-h-20"
              />

              <Button onClick={saveSession} className="w-full">
                <Award className="w-4 h-4 mr-2" />
                حفظ التقييم
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
