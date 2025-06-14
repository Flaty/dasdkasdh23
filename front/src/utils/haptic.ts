// src/utils/haptic.ts

// Получаем доступ к API, делаем это один раз
const HapticFeedback = window.Telegram?.WebApp?.HapticFeedback;

// Наш объект-сервис. Если API недоступно, все функции будут просто пустышками.
export const haptic = {
  /** Легкий щелчок. Для выбора, переключения табов. */
  light: () => {
    if (HapticFeedback) {
      HapticFeedback.impactOccurred('light');
    }
  },

  /** Средний толчок. Для подтверждения действия (нажатие кнопки). */
  medium: () => {
    if (HapticFeedback) {
      HapticFeedback.impactOccurred('medium');
    }
  },

  /** Сильный удар. Для важных, завершающих действий. */
  heavy: () => {
    if (HapticFeedback) {
      HapticFeedback.impactOccurred('heavy');
    }
  },

  /** Сигнал об успешном завершении операции. */
  success: () => {
    if (HapticFeedback) {
      HapticFeedback.notificationOccurred('success');
    }
  },

  /** Сигнал об ошибке. */
  error: () => {
    if (HapticFeedback) {
      HapticFeedback.notificationOccurred('error');
    }
  },

  /** Сигнал-предупреждение. */
  warning: () => {
     if (HapticFeedback) {
      HapticFeedback.notificationOccurred('warning');
    }
  }
};