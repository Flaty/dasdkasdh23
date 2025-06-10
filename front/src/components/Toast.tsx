import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  variant?: "success" | "error" | "info";
}

export default function Toast({
  message,
  onClose,
  duration = 3000,
  variant = "info",
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), duration - 300);
    const removeTimer = setTimeout(onClose, duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "40%",// ⬅️ Прямо по центру экрана
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        background: "#1f1f22",
        color: "white",
        padding: "12px 20px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 500,
        border: "1px solid #444",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
        pointerEvents: "none",
        maxWidth: "90vw",
        textAlign: "center",
      }}
    >
      {message}
    </div>,
    document.body
  );
}
