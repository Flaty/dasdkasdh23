// src/components/ui/InteractiveButton.tsx

import { type ButtonHTMLAttributes, type ReactNode } from "react"
import { haptic } from "../../utils/haptic"

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  hapticType?: "light" | "medium" | "success"
}

/**
 * Интерактивная кнопка с haptic feedback
 * Следует принципам Apple HIG и Material Design 3
 */
export function InteractiveButton({ 
  children,
  onClick,
  variant = "primary",
  size = "md",
  loading = false,
  hapticType = "light",
  disabled,
  className = "",
  ...props 
}: InteractiveButtonProps) {
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      haptic[hapticType]()
      onClick?.(e)
    }
  }

  const baseClasses = "relative overflow-hidden transition-all duration-200 font-semibold rounded-2xl transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
  
  const variantClasses = {
    primary: "bg-white text-black hover:bg-gray-100 active:bg-gray-200",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/15 active:bg-white/20",
    ghost: "bg-transparent text-white hover:bg-white/5 active:bg-white/10"
  }
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm", 
    lg: "px-8 py-4 text-base"
  }

  const isDisabled = disabled || loading

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <span className={loading ? "opacity-0" : "opacity-100 transition-opacity duration-200"}>
        {children}
      </span>
    </button>
  )
}

/**
 * Кнопка-иконка с haptic feedback
 */
export function IconButton({
  children,
  onClick,
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode
  onClick?: () => void
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const handleClick = () => {
    haptic.light()
    onClick?.()
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full bg-white/5 border border-white/10
        transition-all duration-200
        hover:bg-white/10 active:scale-95
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}