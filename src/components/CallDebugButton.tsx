'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

export default function CallDebugButton() {
  return (
    <Link href="/call-debug">
      <Button 
        variant="outline" 
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-red-500 text-white border-red-600 hover:bg-red-600"
      >
        <Bug className="h-4 w-4 mr-2" />
        تشخيص المكالمات
      </Button>
    </Link>
  );
}
