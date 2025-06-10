// src/components/ui/Card.tsx

import { type HTMLAttributes, type ReactNode } from "react"
import { haptic } from "../../utils/haptic"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  onClick?: () => void
  variant?: "default" | "interactive" | "highlighted"
  padding?: "sm" | "md" | "lg"
}

/**
 * Универсальная карточка с опциональной интерактивностью
 */
export function Card({ 
  children, 
  onClick, 
  variant = "default",
  padding = "md",
  className = "",
  ...props 
}: CardProps) {
  
  const handleClick = () => {
    if (onClick) {
      haptic.light()
      onClick()
    }
  }

  const baseClasses = "bg-white/5 border border-white/10 rounded-2xl transition-all duration-200"
  
  const variantClasses = {
    default: "",
    interactive: "cursor-pointer hover:bg-white/8 active:scale-[0.99]",
    highlighted: "bg-white/8 border-white/20"
  }
  
  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  }

  const isInteractive = onClick || variant === "interactive"

  return (
    <div
      onClick={handleClick}
      className={`
        ${baseClasses} 
        ${isInteractive ? variantClasses.interactive : variantClasses[variant]}
        ${paddingClasses[padding]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Карточка профиля с предустановленными стилями
 */
export function ProfileCard({ 
  title, 
  subtitle, 
  icon, 
  onClick,
  className = "" 
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <Card 
      onClick={onClick}
      variant={onClick ? "interactive" : "default"}
      className={className}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="shrink-0 text-white/70">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white leading-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-white/50 mt-1 leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Карточка заказа с предустановленными стилями  
 */
export function OrderCard({
  orderNumber,
  status,
  date,
  category,
  price,
  onClick,
  className = ""
}: {
  orderNumber: string
  status: string
  date: string
  category: string
  price: number
  onClick?: () => void
  className?: string
}) {
  return (
    <Card 
      onClick={onClick}
      variant="interactive"
      className={className}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-sm font-medium text-white">
          №{orderNumber}
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
          {status}
        </div>
      </div>
      
      <div className="text-xs text-white/50 space-y-1 mb-3">
        <div>{date} · {category}</div>
      </div>
      
      <div className="text-lg font-bold text-white">
        {price.toLocaleString('ru-RU')} ₽
      </div>
    </Card>
  )
}