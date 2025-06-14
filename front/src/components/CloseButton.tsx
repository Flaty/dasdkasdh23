export const CloseButton = () => {
  const handleClose = () => {
    // Проверяем, что мы в Telegram, прежде чем вызывать
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };
  
  return (
    <div
      className="fixed top-0 left-0 z-50 p-2"
      style={{
        // Отступ сверху, равный высоте системного статус-бара ("челки").
        // Telegram сам предоставляет эту CSS-переменную.
        paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)`,
      }}
    >
      <button 
        onClick={handleClose} 
        className="bg-black/40 hover:bg-black/60 text-sm text-white font-medium px-4 py-2 rounded-full transition-all active:scale-95 backdrop-blur-sm border border-white/10"
      >
        Закрыть
      </button>
    </div>
  );
};