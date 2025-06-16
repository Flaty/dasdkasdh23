// components/BottomSheetSelector.tsx - ВЕРСИЯ БЕЗ КРИНЖА

import { useRef, useState, type ReactNode } from "react";
import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";
import { haptic } from "../utils/haptic";

export interface Option {
  label: ReactNode;
  value: string;
}

interface Props {
  title: string;
  value: string;
  setValue: (val: string) => void;
  options: Option[];
  placeholder?: ReactNode;
  className?: string;
}

export default function BottomSheetSelector({
  title,
  value,
  setValue,
  options,
  placeholder = "Сделай выбор",
  className = ""
}: Props) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    haptic.light();
    setValue(val);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        // 🔥 УЛУЧШЕННЫЙ СТИЛЬ КНОПКИ
        // Добавляем тернарный оператор для фона: ярче, когда открыто.
        className={`w-full text-left flex items-center justify-between transition-colors duration-200 p-4 rounded-xl ${className} ${open ? 'bg-white/[.08]' : 'bg-white/[.04] hover:bg-white/[.06]'}`}
      >
        {selected ? selected.label : placeholder}
        {/* 🔥 УЛУЧШЕННЫЙ СТИЛЬ ИКОНКИ
            - Убираем text-gray-400, делаем ее белой, но с прозрачностью.
            - Вместо rotate-180 используем scale-125 (увеличение) и убираем прозрачность (text-white).
        */}
        <span className={`text-white/60 transition-all duration-300 ease-in-out ${open ? 'scale-125 text-white' : ''}`}>⌄</span>
      </button>

      <BottomSheet
        ref={sheetRef}
        title={title}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-col gap-2">
            {options.map((item) => {
              const isActive = item.value === value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl w-full transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white ring-1 ring-white/20"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
        </div>
      </BottomSheet>
    </>
  );
}