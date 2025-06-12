// src/components/TabBar.tsx
import { useLocation } from "react-router-dom";
import { User, Package, Calculator } from "lucide-react";
import { useCustomNavigate } from "../utils/useCustomNavigate";

const tabs = [
  { to: "/profile", label: "Профиль", icon: User },
  { to: "/calc", label: "Расчёт", icon: Calculator },
  { to: "/cart", label: "Заказы", icon: Package },
];

export default function TabBar() {
  const navigate = useCustomNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center">
      {tabs.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;

        return (
          <button
            key={to}
            onClick={() => {
              // ✅ ВОТ И ФИКС: Если таб уже активен, ничего не делаем.
              if (isActive) return;
              
              if (navigator.vibrate) navigator.vibrate(20);
              navigate(to, { replace: true });
            }}
            className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[80px] group"
          >
            {/* Иконка и текст */}
            <Icon 
              size={20} 
              strokeWidth={1.8} 
              className={`relative z-10 transition-all duration-200 ${
                isActive ? "text-white scale-110" : "text-white/40 group-active:scale-95"
              }`}
            />
            <span className={`relative z-10 text-[11px] font-medium transition-colors duration-200 ${
              isActive ? "text-white" : "text-white/40"
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}