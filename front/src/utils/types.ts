// types.ts

// Этот интерфейс у тебя правильный, оставляем
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

// 🔥🔥🔥 ВОТ ГЛАВНЫЙ ФИКС 🔥🔥🔥
// Обновляем интерфейс заказа в соответствии с бэкендом
export interface Order {
  _id: string; // Уникальный ID от MongoDB, для React-ключей
  publicId: string; // Наш новый, красивый, публичный ID
  id?: string; // Старый ID делаем НЕОБЯЗАТЕЛЬНЫМ (для старых заказов в базе)

  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  price: number;
  createdAt: string;
  
  // Приводим статусы в соответствие с бэкендом
  status: 
    | 'pending'
    | 'awaiting_payment'
    | 'paid'
    | 'to_warehouse'
    | 'at_warehouse'
    | 'to_moscow'
    | 'in_moscow'
    | 'shipped_cdek'
    | 'ready_for_pickup'
    | 'completed'
    | 'rejected';
}

// Этот тип тоже в порядке, оставляем
export type CreateOrderPayload = {
  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  rawPoizonPrice: number;
  address: UserAddress;
};