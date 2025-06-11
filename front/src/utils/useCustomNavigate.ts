// src/utils/useCustomNavigate.ts

import { useNavigate, type NavigateOptions } from 'react-router-dom';

export function useCustomNavigate() {
  const navigate = useNavigate();
  
  // ✅ Наша функция теперь принимает второй, опциональный аргумент - объект опций
  // Это делает ее полностью совместимой с оригинальным navigate
  const customNavigate = (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to);
    } else {
      navigate(to, options);
    }
  };

  return customNavigate;
}