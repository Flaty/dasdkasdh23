import { useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import BottomSheet from "./BottomSheet"
import type { BottomSheetHandle } from "./BottomSheet"

export interface Option {
  label: string
  value: string
}

interface Props {
  title: string
  value: string
  setValue: (val: string) => void
  options: Option[]
  placeholder?: string
}

export default function BottomSheetSelector({
  title,
  value,
  setValue,
  options,
  placeholder = "Сделай выбор",
}: Props) {
  const [open, setOpen] = useState(false)
  const sheetRef = useRef<BottomSheetHandle>(null)

  const selected = options.find((o) => o.value === value)

  const handleSelect = (val: string) => {
    setValue(val)
    sheetRef.current?.dismiss()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card text-left text-sm min-h-[56px] flex items-center justify-between px-4"
      >
        {selected ? selected.label : placeholder}
        <span className="text-[#888]">⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <BottomSheet ref={sheetRef} title={title} onClose={() => setOpen(false)}>
            {options.map((item) => {
              const isActive = item.value === value
              return (
                <button
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl w-full transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white ring-2 ring-white/20"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </BottomSheet>
        )}
      </AnimatePresence>
    </>
  )
}
