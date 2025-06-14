// backend/utils/botHelpers.js

// Объект для человекочитаемых статусов
export const statusLabels = {
  pending: 'На проверке',
  awaiting_payment: 'Ожидает оплаты',
  paid: 'Оплачен',
  to_warehouse: 'Едет на склад',
  at_warehouse: 'На складе',
  to_moscow: 'Едет в Москву',
  in_moscow: 'В Москве',
  shipped_cdek: 'Отправлен СДЭК',
  ready_for_pickup: 'Готов к выдаче',
  completed: 'Завершен',
  rejected: 'Отклонен'
};

// Функция для экранирования символов в MarkdownV2
export function escapeMarkdown(text) {
  if (typeof text !== 'string') return '';
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.replace(new RegExp(`[\\${escapeChars.join('\\')}]`, 'g'), '\\$&');
}