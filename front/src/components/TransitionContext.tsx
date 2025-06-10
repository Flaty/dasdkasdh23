import { createContext, useContext } from "react";
import { getManualDirection } from "../utils/transitionDirection";

interface TransitionContextType {
  direction: number;
}

const TransitionContext = createContext<TransitionContextType>({
  direction: 1,
});

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <TransitionContext.Provider value={{ direction: getManualDirection() }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransitionDirection() {
  return useContext(TransitionContext);
}
