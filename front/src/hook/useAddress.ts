// src/hook/useAddress.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserAddress {
  userId: number;
  city: string;
  city_code: string;
  street: string;
  name: string;
  phone: string;
  deliveryType: "pickup" | "address";
  pickupCode?: string;
  pickupAddress?: string;
}

const DEFAULT_ADDRESS: UserAddress = {
  userId: 0,
  city: "", city_code: "", street: "", name: "", phone: "",
  deliveryType: "pickup", pickupCode: "", pickupAddress: "",
};

const fetchAddress = async (userId: number): Promise<UserAddress> => {
  const response = await fetch(`/api/user/address?userId=${userId}`);
  if (!response.ok) throw new Error("Ошибка загрузки адреса");
  const data = await response.json();
  return data && data.userId ? data : { ...DEFAULT_ADDRESS, userId };
};

const postAddress = async (addressData: UserAddress): Promise<any> => {
  const response = await fetch("/api/user/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addressData),
  });
  if (!response.ok) throw new Error("Ошибка сохранения адреса");
  return response.json();
};

export function useAddress(userId?: number) {
  const queryClient = useQueryClient();

  const { data: addressData, isLoading: isLoadingAddress } = useQuery({
    queryKey: ["address", userId],
    queryFn: () => fetchAddress(userId!),
    enabled: !!userId,
    // ✅ Убираем staleTime: Infinity. Теперь данные будут считаться устаревшими сразу.
    // refetchOnWindowFocus: true, // По умолчанию true, это хорошо. Данные обновятся при фокусе на вкладке.
    initialData: { ...DEFAULT_ADDRESS, userId: userId || 0 },
  });

  const { mutateAsync: saveAddress, isPending: isSavingAddress } = useMutation({
    mutationFn: postAddress,
    onSuccess: (_, sentVariables) => {
      queryClient.setQueryData(["address", sentVariables.userId], sentVariables);
      queryClient.invalidateQueries({ queryKey: ['profile', sentVariables.userId] });
    },
    onError: (error) => {
      console.error("Ошибка мутации адреса:", error);
    },
  });

  return {
    addressData,
    saveAddress,
    isLoadingAddress,
    isSavingAddress,
  };
}