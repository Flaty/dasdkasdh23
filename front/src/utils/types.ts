// types.ts
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

// 👇 ДОБАВЬ вот это
export type CreateOrderPayload = {
  userId: number;
  username?: string;
  link: string;
  category: string;
  shipping: string;
  rawPoizonPrice: number;
};