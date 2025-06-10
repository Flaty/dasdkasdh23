import { ReactNode } from "react"
import { ChevronRightIcon } from "@heroicons/react/24/outline"

interface Props {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
}

export default function ProfileSectionCard({ icon, title, subtitle, onClick }: Props) {
  const isClickable = typeof onClick === "function"

  return (
    <div
      onClick={onClick}
      className={`flex items-start justify-between gap-3 p-4 rounded-xl bg-[#1f1f22] transition-colors ${
        isClickable ? "cursor-pointer hover:bg-[#2a2a2f]" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="mt-1 shrink-0">{icon}</div>
        <div>
          <div className="text-white font-semibold text-[15px] leading-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-[#a1a1aa] text-sm leading-snug whitespace-pre-line">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {isClickable && (
        <ChevronRightIcon className="w-4 h-4 mt-1 text-[#666]" />
      )}
    </div>
  )
}
