// src/components/ProfileHeader.tsx
import { useState } from "react";
import { getUserData } from "../utils/user";
import BottomSheet from "./BottomSheet";
import { MessageSquareQuote } from 'lucide-react';

// Вспомогательный компонент для кнопки "Закрыть", чтобы не загромождать основной код
const CloseButton = () => {
  const handleClose = () => {
    // Проверяем, что мы в Telegram, прежде чем вызывать
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };
  return (
    <button onClick={handleClose} className="bg-white/5 hover:bg-white/10 text-sm text-white font-medium px-4 py-2 rounded-full transition-colors active:scale-95">
      Закрыть
    </button>
  );
};

export const ProfileHeader = () => {
  const user = getUserData();
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 max-w-screen-sm mx-auto"
        style={{
          // Отступ сверху, равный высоте системного статус-бара ("челки" или часов).
          // Telegram сам предоставляет эту CSS-переменную.
          paddingTop: `var(--tg-viewport-header-height)`,
          // Дополнительный отступ снизу для красоты
          paddingBottom: '12px',
          // Градиент, чтобы контент плавно уходил под хедер при скролле
          background: 'linear-gradient(to bottom, #0a0a0a 85%, transparent)'
        }}
      >
        <CloseButton />
        
        {/* Аватарка теперь является частью хедера */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2" style={{ paddingTop: `var(--tg-viewport-header-height)` }}>
           <img src={user?.photo_url || "https://placehold.co/40x40"} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white/10" />
        </div>

        <button onClick={() => setSupportOpen(true)} className="p-2.5 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-95">
          <MessageSquareQuote className="w-5 h-5" />
        </button>
      </header>
      
      {/* BottomSheet для поддержки теперь живет здесь, вместе с кнопкой */}
      <BottomSheet title="Поддержка" open={supportOpen} onClose={() => setSupportOpen(false)}>
        <div className="text-left space-y-5">
            <p className="text-sm text-white/70 leading-snug">
              Свяжись с менеджером в Telegram, если у тебя возникли вопросы по расчёту, заказу или доставке.
            </p>
            <a href="https://t.me/Littleton59" target="_blank" rel="noopener noreferrer" className="block w-full text-center text-sm font-medium text-white rounded-full py-2.5 bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30 transition-colors">
              Написать в Telegram
            </a>
            <p className="text-xs text-white/30 text-center mt-6">Отвечаем в течение пары минут</p>
        </div>
      </BottomSheet>
    </>
  );
};