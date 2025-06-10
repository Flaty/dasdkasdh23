// src/components/skeletons/CalcSkeleton.tsx
import { SkeletonBase } from "./SkeletonBase"

export function CalcSkeleton() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <SkeletonBase className="h-8 w-60" />
          <SkeletonBase className="h-4 w-48" />
        </div>

        {/* Form Fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-12 w-full rounded-2xl" />
          </div>
        ))}

        {/* Button */}
        <SkeletonBase className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}