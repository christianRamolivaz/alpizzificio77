export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  preferences?: UserPreferences;
  role?: 'admin' | 'user' | string;
}

export interface UserPreferences {
  favoriteItems?: string[]; // IDs of favorite menu items
  allergens?: string[];
  dietaryRestrictions?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  ingredients: string[];
  image?: string;
  allergens?: string[];
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  estimatedDelivery?: Date;
  deliveryAddress?: string;
  notes?: string;
}

export interface CartItem extends OrderItem {
  id: string; // Unique cart item ID
}

export interface OpeningDay {
  dayOfWeek: number; // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
  dayName: string;   // 'Domenica', 'Lunedì', 'Martedì', ecc.
  isOpen: boolean;   // true se aperto, false se chiuso
  isWeekend: boolean;// true se orario weekend (18:00 - 22:30), false se normale (18:00 - 21:30)
}
