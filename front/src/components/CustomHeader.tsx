// src/components/CustomHeader.tsx

import { useState } from "react";
import { getUserData } from "../utils/user";
import BottomSheet from "./BottomSheet";
import { MessageSquareQuote } from 'lucide-react';

const CloseButton = () => {
  const handleClose = () => window.Telegram?.WebApp.close();
  return (
    <button onClick={handleClose} className="bg-white/5 hover:bg-white/10 text-sm text-white font-medium px-4 py-2 rounded-full transition-colors active:scale-95">
      Закрыть
    </button>
  );
};

export const CustomHeader = () => {
  const user = getUserData();
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 max-w-screen-sm mx-auto"
        style={{
          paddingTop: `var(--tg-viewport-header-height)`,
          paddingBottom: '12px',
          background: 'linear-gradient(to bottom, #0a0a0a 85%, transparent)'
        }}
      >
        <div className="w-20"><CloseButton /></div>
        
        <div className="flex-1 flex justify-center">
           <img src={user?.photo_url || "https://placehold.co/40x40"} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white/10" />
        </div>

        <div className="w-20 flex justify-end">
          <button onClick={() => setSupportOpen(true)} className="p-2.5 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-95">
            <MessageSquareQuote className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <BottomSheet title="Поддержка" open={supportOpen} onClose={() => setSupportOpen(false)}>
        <div className="text-left space-y-5">
            <p className="text-sm text-white/70 leading-snug">Свяжись с менеджером...</p>
            <a href="https://t.me/Littleton59" target="_blank" rel="noopener noreferrer" className="block w-full text-center ...">
              Написать в Telegram
            </a>
        </div>
      </BottomSheet>
    </>
  );
};