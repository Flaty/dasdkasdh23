// src/utils/useCustomNavigate.ts

import { useNavigate, useLocation } from "react-router-dom";
import { useSetTransitionDirection } from "./TransitionDirectionContext";

// Явная карта переходов между страницами
const routeTransitions: Record<string, Record<string, "forward" | "backward">> = {
  "/profile": {
    "/calc": "forward",
    "/cart": "forward",
  },
  "/calc": {
    "/profile": "backward",
    "/cart": "forward",
  },
  "/cart": {
    "/calc": "backward",
    "/profile": "backward",
  },
};

export function useCustomNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const setDirection = useSetTransitionDirection();

  return (to: string | number, direction?: "forward" | "backward") => {
    // Обработка перехода назад по истории (navigate(-1))
    if (typeof to === "number") {
      setDirection(direction || "backward");
      navigate(to);
      return;
    }

    // Обработка перехода по строке (пути)
    if (direction) {
      // Если направление задано вручную - используем его
      setDirection(direction);
    } else {
      // Иначе - вычисляем по нашей карте
      const from = location.pathname;
      const definedDirection = routeTransitions[from]?.[to];
      setDirection(definedDirection || "forward"); // По умолчанию - 'forward'
    }

    navigate(to);
  };
}