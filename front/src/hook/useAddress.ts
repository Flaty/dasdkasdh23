// src/hook/useAddress.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJSON, postJSON } from "../api/fetchWithAuth";
import type { UserAddress } from "../utils/types";

// ✅ ЭКСПОРТИРУЕМ ТИП ДАЛЬШЕ
export type { UserAddress };

// Функция получает адрес. Если адреса нет, бэкенд вернет пустой объект, мы вернем null.
const fetchAddress = async (): Promise<UserAddress | null> => {
  const data = await getJSON<UserAddress>('/api/user/address');
  return data && data.userId ? data : null;
};

// Функция сохраняет адрес.
const postAddress = async (addressData: UserAddress): Promise<UserAddress> => {
  return postJSON<UserAddress>("/api/user/address", addressData);
};

export function useAddress(userId?: number) {
  const queryClient = useQueryClient();

  // ✅ ЗАПРОС СТАНОВИТСЯ ПРОЩЕ. Он либо вернет данные, либо null, либо будет в состоянии загрузки.
  const { data: addressData, isLoading: isLoadingAddress } = useQuery({
    queryKey: ["address", userId],
    queryFn: fetchAddress,
    enabled: !!userId,
  });

  const { mutateAsync: saveAddress, isPending: isSavingAddress } = useMutation({
    mutationFn: postAddress,
    onSuccess: (savedData) => {
      // ✅ Обновляем кеш вручную, чтобы UI мгновенно обновился.
      queryClient.setQueryData(["address", userId], savedData);
      // Инвалидируем кеш профиля, т.к. он тоже содержит адрес.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    addressData,
    saveAddress,
    isLoadingAddress,
    isSavingAddress,
  };
}