// src/components/skeletons/OrdersSkeleton.tsx
import { SkeletonBase } from "./SkeletonBase"

export function OrdersSkeleton() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      {/* Header */}
      <SkeletonBase className="h-8 w-40 mb-4" />

      {/* Filters */}
      <div className="bg-[#0f0f10] pt-1 pb-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBase key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <SkeletonBase className="h-4 w-16" />
              <SkeletonBase className="h-6 w-24 rounded-full" />
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
              <SkeletonBase className="h-3 w-32" />
              <SkeletonBase className="h-3 w-40" />
            </div>

            {/* Price */}
            <SkeletonBase className="h-6 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}