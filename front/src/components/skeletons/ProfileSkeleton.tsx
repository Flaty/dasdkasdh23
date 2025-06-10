// src/components/skeletons/ProfileSkeleton.tsx
import { SkeletonBase } from "./SkeletonBase"

export function ProfileSkeleton() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      {/* Avatar + Info */}
      <div className="flex flex-col items-center gap-2 text-center mb-4">
        <SkeletonBase className="w-24 h-24 rounded-full" />
        <SkeletonBase className="h-6 w-32" />
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-3 w-28" />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 pb-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-white/5 border border-white/10 px-4 py-3">
            <SkeletonBase className="h-4 w-24 mb-2" />
            <SkeletonBase className="h-5 w-40 mb-1" />
            <SkeletonBase className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}