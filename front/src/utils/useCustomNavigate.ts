import { useNavigate, useLocation } from "react-router-dom";
import { useSetTransitionDirection } from "./TransitionDirectionContext";

// Явная карта переходов между страницами
const routeTransitions: Record<string, Record<string, "forward" | "backward">> = {
  "/profile": {
    "/calc": "forward",
    "/cart": "forward",     // 👈 ДОБАВИЛ ЭТО
  },
  "/calc": {
    "/profile": "backward",
    "/cart": "forward",
  },
  "/cart": {
    "/calc": "backward",
    "/profile": "backward", // 👈 УЖЕ ЕСТЬ
  },
};

export function useCustomNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const setDirection = useSetTransitionDirection();

  return (to: string | number, direction?: "forward" | "backward") => {
    if (typeof to === "string") {
      if (direction) {
        setDirection(direction);
      } else {
        const from = location.pathname;
        const map = routeTransitions[from];
        if (map && map[to]) {
          setDirection(map[to]);
        } else {
          setDirection("forward");
        }
      }

      navigate(to);
    } else if (typeof to === "number") {
      setDirection(direction || "backward");
      navigate(to);
    }
  };
}
