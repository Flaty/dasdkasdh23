// src/components/skeletons/SkeletonBase.tsx
export function SkeletonBase({ className = "", ...props }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 animate-pulse rounded-xl ${className}`}
      {...props}
    />
  )
}