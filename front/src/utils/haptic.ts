// src/utils/haptic.ts

/**
 * Haptic feedback utilities для современных мобильных приложений
 * Следует принципам Apple HIG и Material Design
 */

export const haptic = {
  /**
   * Легкая вибрация для обычных взаимодействий
   * Используется: нажатие кнопок, переключение табов
   */
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },

  /**
   * Средняя вибрация для важных действий  
   * Используется: отправка формы, добавление в корзину
   */
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15)
    }
  },

  /**
   * Вибрация успеха
   * Используется: успешная отправка, сохранение
   */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 5, 10])
    }
  },

  /**
   * Вибрация ошибки
   * Используется: ошибки валидации, сетевые ошибки
   */
  error: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([25, 10, 25])
    }
  },

  /**
   * Длинная вибрация для критичных действий
   * Используется: удаление, критичные подтверждения
   */
  heavy: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25)
    }
  }
}

/**
 * Проверка поддержки вибрации устройством
 */
export const isHapticSupported = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}

/**
 * Хук для использования в React компонентах
 */
export const useHaptic = () => {
  return {
    ...haptic,
    isSupported: isHapticSupported()
  }
}