// src/api/fetchWithAuth.ts

// Базовый URL для API. Берем из переменных окружения.
// В режиме разработки это будет undefined, и мы будем использовать относительные пути,
// которые будут перехвачены прокси Vite.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Обертка над fetch, которая автоматически добавляет токен авторизации
 * и обрабатывает базовые ошибки.
 * @param url - Путь к API (например, '/api/profile')
 * @param options - Стандартные опции для fetch (method, body, etc.)
 * @returns - Промис с ответом fetch
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');

  // Создаем объект заголовков, копируя существующие, если они есть
  const headers = new Headers(options.headers || {});
  
  // Добавляем заголовок Content-Type для POST/PUT/PATCH запросов, если он не указан
  if (options.body && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  // Добавляем токен авторизации, если он есть
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  // Формируем полный URL
  const fullUrl = `${API_BASE_URL}${url}`;

  // Выполняем запрос
  const response = await fetch(fullUrl, { ...options, headers });

  // Обработка ошибок авторизации
  if (response.status === 401 || response.status === 403) {
      // Токен невалиден или протух.
      // Очищаем localStorage и перезагружаем страницу, чтобы запустить процесс аутентификации заново.
      localStorage.removeItem('jwt_token');
      window.location.reload();

      // Выбрасываем ошибку, чтобы прервать дальнейшее выполнение кода
      throw new Error('Сессия истекла. Пожалуйста, перезапустите приложение.');
  }

  return response;
}

/**
 * Упрощенная версия для GET-запросов, которая сразу парсит JSON.
 * @param url - Путь к API
 * @returns - Промис с распарсенными данными
 */
export async function getJSON<T>(url: string): Promise<T> {
    const response = await fetchWithAuth(url);
    if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.statusText}`);
    }
    return response.json();
}