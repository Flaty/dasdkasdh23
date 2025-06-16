// src/utils/haptic.ts - СЕНЬОРСКАЯ ВЕРСИЯ С OPTIONAL CHAINING

/**
 * Безопасно вызывает Haptic Feedback API, используя опциональные цепочки.
 * Если любой из объектов (Telegram, WebApp, HapticFeedback) отсутствует,
 * цепочка прерывается и ничего не происходит. Ошибки не будет.
 */
function safeImpact(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
}

function safeNotification(type: 'error' | 'success' | 'warning') {
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(type);
}

function safeSelection() {
  window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();
}

// Экспортируем удобный объект-сервис для использования в приложении.
// Каждая функция теперь - это один чистый вызов.
export const haptic = {
  /** Легкий щелчок. Для выбора, переключения табов. */
  light: () => safeImpact('light'),

  /** Средний толчок. Для подтверждения действия (нажатие кнопки). */
  medium: () => safeImpact('medium'),

  /** Сильный удар. Для важных, завершающих действий. */
  heavy: () => safeImpact('heavy'),

  /** Сигнал об успешном завершении операции. */
  success: () => safeNotification('success'),

  /** Сигнал об ошибке. */
  error: () => safeNotification('error'),

  /** Сигнал-предупреждение. */
  warning: () => safeNotification('warning'),
  
  /** Сигнал для выбора элемента в "барабане" или списке. */
  selection: () => safeSelection(),
};