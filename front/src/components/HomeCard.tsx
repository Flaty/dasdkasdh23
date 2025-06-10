import type { ReactNode } from "react"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"

interface Props {
  icon: ReactNode
  label: string
  description?: string
  showArrow?: boolean
  onClick?: () => void
  delayIndex?: number
  type?: "default" | "cta" | "quiet" | "info" | "subtle"
}

export default function HomeCard({
  icon,
  label,
  description,
  showArrow = false,
  onClick,
  delayIndex = 0,
  type = "default",
}: Props) {
  const base = "group relative flex items-center justify-between px-5 transition-all duration-300 transform-gpu backdrop-blur-md"
  const size = {
    default: "py-4 rounded-xl w-full",
    cta: "py-5 rounded-2xl w-full animate-pulse-slow",
    quiet: "py-4 rounded-xl w-full",
    info: "py-5 rounded-xl w-full",
    subtle: "py-3 rounded-xl w-full",
  }

  const styles = {
    default: "bg-white/5 border border-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_4px_rgba(255,255,255,0.02)]",
    cta: "btn-cta-pulse",
    quiet: "bg-white/3 border border-white/5 text-white/70",
    info: "bg-white/5 border border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
    subtle: "bg-transparent border border-white/5 text-white/40 italic",
  }

  const textWeight = type === "cta" ? "font-semibold" : "font-medium"
  const iconSize = "w-5 h-5"

  return (
    <button
      onClick={onClick}
      className={clsx(
        base,
        size[type],
        styles[type],
        "hover:outline hover:outline-1 hover:outline-white/10 hover:scale-[1.01] active:scale-[0.985]"
      )}
    >
      <div className="flex items-center gap-3 text-left relative z-10">
        <div className={clsx(iconSize, "text-inherit group-hover:scale-[1.05] transition-transform duration-300")}>{icon}</div>
        <div className="flex flex-col">
          <span className={clsx("text-[15px] leading-tight", textWeight)}>{label}</span>
          {description && (
            <span className="text-xs opacity-70 leading-tight mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>

      {showArrow && (
        <ArrowRightIcon className="w-4 h-4 text-inherit group-hover:translate-x-1 transition-transform relative z-10" />
      )}
    </button>
  )
}
