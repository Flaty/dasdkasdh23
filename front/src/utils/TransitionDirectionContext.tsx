import { createContext, useContext, useState } from "react";

const DirectionContext = createContext<"forward" | "backward">("forward");
const SetDirectionContext = createContext<(dir: "forward" | "backward") => void>(() => {});

export function useTransitionDirection() {
  return useContext(DirectionContext);
}

export function useSetTransitionDirection() {
  return useContext(SetDirectionContext);
}

export function TransitionDirectionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  return (
    <DirectionContext.Provider value={direction}>
      <SetDirectionContext.Provider value={setDirection}>
        {children}
      </SetDirectionContext.Provider>
    </DirectionContext.Provider>
  );
}
