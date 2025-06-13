export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

let cachedUser: User | null = null;

export function setUserData(user: User) {
  cachedUser = user;
}

// ✅ ФИКС: Добавляем экспорт для этой функции
export function clearUserData() {
  cachedUser = null;
}

export function getUserData(): User | null {
  if (cachedUser) return cachedUser;

  const params = new URLSearchParams(window.location.search);
  const userParam = params.get("user");

  if (userParam) {
    try {
      cachedUser = JSON.parse(decodeURIComponent(userParam));
      return cachedUser;
    } catch (err) {
      console.error("Ошибка парсинга пользователя", err);
    }
  }

  // fallback: если дев-среда — возвращаем мок-юзера
  if (import.meta.env.DEV) {
    cachedUser = {
      id: 1,
      first_name: "Илья",
      username: "dev_ilya",
      photo_url: "https://i.pinimg.com/736x/3e/99/ab/3e99abe53263336e4b7f7c18d586f8d7.jpg",
      language_code: "ru",
      allows_write_to_pm: true,
    };
    return cachedUser;
  }

  return null;
}
