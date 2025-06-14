// src/utils/types.ts

// ✅ Полный и правильный тип заказа, как на бэкенде
export interface Order {
  _id: string;
  publicId: string;
  userId: number;
  username: string;
  link: string;
  category: string;
  shipping: string;
  price: number;
  status: 
    | 'pending' | 'awaiting_payment' | 'paid' | 'to_warehouse'
    | 'at_warehouse' | 'to_moscow' | 'in_moscow' | 'shipped_cdek'
    | 'ready_for_pickup' | 'completed' | 'rejected';
  deliveryType: 'address' | 'pickup';
  city: string;
  street: string;
  fullName: string;
  phone: string;
  pickupCode?: string;
  pickupAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ Правильный тип адреса с city_code: number
export interface UserAddress {
  userId: number;
  name: string;
  phone: string;
  city: string;
  city_code: number; // Был string, стал number
  street: string;
  deliveryType: 'pickup' | 'address';
  pickupCode?: string;
  pickupAddress?: string;
}

// ✅ Тип для ачивок, который нужен в профиле
export interface Achievement {
  id: string;
  name: string;
  icon: string;
  is_completed: boolean;
}

// ✅ Полный тип данных для страницы профиля
export interface ProfileData {
  days_in_ecosystem: number;
  loyalty_status: {
    name: string;
    icon: string;
    next_status_name: string | null;
    orders_to_next_status: number;
    progress_percentage: number;
    current_cashback_percent: number;
    perks: string[];
  };
  last_order: Order | null;
  achievements: Achievement[];
  address: UserAddress | null;
  referral_info: {
    link: string;
    is_active: boolean;
    bonus_per_friend: number;
  };
}

// ✅ Этот тип у тебя был, он полезен, оставляем
export type CreateOrderPayload = {
  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  rawPoizonPrice: number;
  address: Omit<UserAddress, 'userId'>; // Для чистоты можно убрать userId, но и так сойдет
};