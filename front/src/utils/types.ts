// types.ts

// ✅ Шаг 1: Добавляем тип для адреса.
// Его структура должна совпадать с тем, что используется в useAddress и отправляется на бэкенд.
export interface UserAddress {
  userId: number;
  city: string;
  city_code: string;
  street: string;
  name: string;
  phone:string;
  deliveryType: "pickup" | "address";
  pickupCode?: string;
  pickupAddress?: string;
}


export interface Order {
  id: string;
  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'to-warehouse' | 'to-moscow';
  createdAt: string;
}

// ✅ Шаг 2: Добавляем поле 'address' в тип для создания заказа.
export type CreateOrderPayload = {
  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  rawPoizonPrice: number;
  address: UserAddress; // <--- ВОТ ЭТА СТРОКА ВСЁ ЧИНИТ
};