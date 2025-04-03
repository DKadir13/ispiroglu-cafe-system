export interface Table {
  number: number;
  status: 'empty' | 'occupied';
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  tableId: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  timestamp: Date;
}