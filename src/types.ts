export type MenuCategory =
  | 'Hot Coffee'
  | 'Cold Coffee'
  | 'Cappuccino'
  | 'Espresso'
  | 'Latte'
  | 'Milkshakes'
  | 'Tea'
  | 'Burgers'
  | 'Pizza'
  | 'Sandwiches'
  | 'Cakes & Desserts';

export const MENU_CATEGORIES: MenuCategory[] = [
  'Hot Coffee',
  'Cold Coffee',
  'Cappuccino',
  'Espresso',
  'Latte',
  'Milkshakes',
  'Tea',
  'Burgers',
  'Pizza',
  'Sandwiches',
  'Cakes & Desserts',
];

export interface Product {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image: string;
  featured: boolean;
  available: boolean;
  originNote?: string;
  prepTime?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'Received'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  paymentMethod: 'Card' | 'Cash on Delivery';
  promoCode?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled';

export interface Reservation {
  id: string;
  bookingCode: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  guests: number;
  seatingArea: 'Main Roastery Lounge' | 'Golden Courtyard' | 'Espresso Bar Counter';
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  roleOrVisit: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalReservations: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  dailyRevenue: Array<{ label: string; revenue: number; orders: number }>;
  categoryRevenue: Array<{ category: string; revenue: number; count: number }>;
}
