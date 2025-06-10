import { useLocation } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import type { ReactNode } from "react";

export function FadeTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <SwitchTransition>
      <CSSTransition
        key={location.pathname}
        classNames="fade"
        timeout={180}
        unmountOnExit
      >
        <div>
          {children}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}
