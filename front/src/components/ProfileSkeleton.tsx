// src/components/ProfileSkeleton.tsx

// Простой компонент для серой заглушки
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-white/10 rounded-lg animate-pulse ${className}`} />;
}

export default function ProfileSkeleton() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden max-w-screen-sm mx-auto no-scrollbar">
      {/* User Info Skeleton */}
      <div className="flex flex-col items-center gap-2 text-center mb-4 relative">
        <SkeletonBlock className="w-24 h-24 rounded-full" />
        <SkeletonBlock className="w-32 h-6 mt-2" />
        <SkeletonBlock className="w-24 h-4" />
        <SkeletonBlock className="w-40 h-3" />
      </div>

      {/* Sections Skeleton */}
      <div className="flex flex-col gap-4 pb-20">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-16" />
      </div>
    </div>
  );
}