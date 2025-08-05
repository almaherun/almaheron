
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
            <Image src="/image/logo.png" alt="Academy logo" width={64} height={64} className="mx-auto" />
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
        </div>
        <p className="text-muted-foreground animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}
