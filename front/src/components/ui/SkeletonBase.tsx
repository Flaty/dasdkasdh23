// src/components/ui/SkeletonBase.tsx

import { type HTMLAttributes } from "react"

interface SkeletonBaseProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: "default" | "circle" | "text"
}

/**
 * Базовый компонент скелетона
 * Следует принципам современного UI дизайна 2025
 */
export function SkeletonBase({ 
  className = "", 
  variant = "default",
  ...props 
}: SkeletonBaseProps) {
  const baseClasses = "bg-white/5 rounded-xl"
  
  const variantClasses = {
    default: "rounded-xl",
    circle: "rounded-full", 
    text: "rounded-lg"
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite ease-in-out"
      }}
      {...props}
    />
  )
}

/**
 * Компонент для скелетона текста
 */
export function SkeletonText({ 
  lines = 1, 
  className = "" 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase 
          key={i}
          variant="text"
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

/**
 * Компонент для скелетона кнопки
 */
export function SkeletonButton({ className = "" }: { className?: string }) {
  return (
    <SkeletonBase 
      className={`h-12 w-full ${className}`}
    />
  )
}

/**
 * Компонент для скелетона аватара
 */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-24 h-24"
  }

  return (
    <SkeletonBase 
      variant="circle"
      className={sizeClasses[size]}
    />
  )
}