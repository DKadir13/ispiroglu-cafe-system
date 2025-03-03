export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
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