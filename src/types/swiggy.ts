export interface SwiggyResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    reportLink?: string;
    reportHint?: string;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  cuisines: string[];
  avgRating?: number;
  totalRatings?: string;
  costForTwo?: string;
  areaName?: string;
  distanceKm?: number;
  deliveryTimeMinutes?: number;
  deliveryTimeRange?: string;
  veg?: boolean;
  offer?: string;
  imageUrl?: string;
  availabilityStatus?: 'OPEN' | 'CLOSED' | 'UNAVAILABLE';
  nextOpenTime?: string;
}

export interface MenuItemSummary {
  name: string;
  price?: number;
  isVeg?: boolean;
  menu_item_id?: string;
  id?: string;
  inStock?: number;
  restaurant_id?: string;
  restaurant_name?: string;
  imageUrl?: string;
  rating?: string | number;
  totalRatings?: string;
  hasVariants?: boolean;
  hasAddons?: boolean;
  isBestseller?: boolean;
  categories?: string[];
}

export interface FoodCartSelection {
  id?: string;
  name?: string;
  group_id?: string;
  variation_id?: string;
  price?: number;
}

export interface FoodCartItem {
  menu_item_id: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  is_veg?: boolean | string | number;
  subtotal: number;
  total: number;
  final_price: number;
  in_stock?: boolean;
}

export interface FoodCartPricing {
  item_total: number;
  delivery_charge: number;
  delivery_charge_strikeoff?: number;
  taxes_and_charges: number;
  to_pay: number;
}

export interface FoodCartOffers {
  coupon_applied?: string | null;
  coupon_discount?: number;
  free_delivery_applied?: boolean;
}

export interface FoodCartData {
  cart_id?: string;
  result?: string;
  restaurant?: {
    id?: string;
    name?: string;
    area?: string;
    deliverySubtitle?: string;
  } | null;
  items?: FoodCartItem[];
  item_count?: number;
  pricing?: FoodCartPricing;
  offers?: FoodCartOffers;
}

export interface UpdateCartItemInput {
  menu_item_id: string;
  quantity: number;
}
