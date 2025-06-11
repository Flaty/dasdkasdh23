// components/BottomSheetSelector.tsx

import { useRef, useState, type ReactNode } from "react";
import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";

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
  // ✅ Управляемое состояние открытия теперь здесь
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    setValue(val);
    // ✅ Просим шторку закрыться, она закроется с анимацией
    sheetRef.current?.dismiss();
  };

  return (
    <>
      {/* Кнопка теперь просто открывает шторку */}
      <button
        onClick={() => setOpen(true)}
        className={`w-full text-left flex items-center justify-between ${className}`}
      >
        {selected ? selected.label : placeholder}
        <span className={`text-gray-400 transition-transform duration-300 ${open ? '-rotate-180' : ''}`}>⌄</span>
      </button>

      {/* ✅ Передаем `open` и `onClose` в обновленный BottomSheet */}
      <BottomSheet
        ref={sheetRef}
        title={title}
        open={open}
        onClose={() => setOpen(false)} // Когда шторка закроется, обновляем состояние
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