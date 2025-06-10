import { useState } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  name?: string;
}

export default function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  name,
}: Props) {
  const [focused, setFocused] = useState(false);
  const float = focused || value;

  return (
    <div className="relative w-full text-white">
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        className="w-full px-4 pt-5 pb-2 bg-[#2c2c30] text-white rounded-xl outline-none text-sm border border-transparent focus:border-[#888] transition-all"
      />
      <label
        className={`absolute left-4 px-1 text-sm pointer-events-none transition-all duration-200 ${
          float
            ? "text-[11px] text-[#aaa] -top-2 scale-100"
            : "top-3.5 text-[#888]"
        }`}
      >
        {label}
      </label>
    </div>
  );
}
