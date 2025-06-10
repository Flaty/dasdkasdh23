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
    <div className="fixed bottom-0 left-0 right-0 h-16 z-50 tabbar-blur flex justify-around items-center">
      {tabs.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;

        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`tab-btn ${isActive ? "tab-btn-active" : ""}`}
          >
            <Icon size={20} strokeWidth={1.8} className="z-10" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
