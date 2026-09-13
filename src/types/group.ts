export type DietaryPreference =
  | 'ANY'
  | 'VEG'
  | 'NON_VEG'
  | 'VEGAN'
  | 'JAIN'
  | 'HIGH_PROTEIN';

export interface ParticipantRequest {
  id: string;
  name: string;
  diet: DietaryPreference;
  dislikedItems?: string[];
  preferredCuisines?: string[];
  maxBudget?: number;
  spicePreference?: 'MILD' | 'MEDIUM' | 'SPICY';
  specificDish?: string;
}

export interface GroupOrderRequirements {
  orderTitle: string;
  addressId: string;
  targetDeliveryMinutes?: number;
  overallBudget?: number;
  participants: ParticipantRequest[];
  preferredStorefront?: 'EATRIGHT' | 'BOLT' | 'STORE_99';
}

export interface AssignedItem {
  participantId: string;
  participantName: string;
  menuItemId: string;
  itemName: string;
  price: number;
  isVeg: boolean;
  quantity: number;
  matchedPreferenceReason: string;
}

export interface OptimizedGroupCart {
  restaurantId: string;
  restaurantName: string;
  areaName: string;
  avgRating: number;
  deliveryTimeMinutes: number;
  assignedItems: AssignedItem[];
  itemTotal: number;
  estimatedDeliveryFee: number;
  estimatedTaxes: number;
  estimatedDiscount: number;
  estimatedToPay: number;
  perPersonAverage: number;
  unmetConstraints: string[];
}

export interface ParticipantSplit {
  participantId: string;
  participantName: string;
  itemSubtotal: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  shareOfTaxesAndFees: number;
  shareOfDiscount: number;
  netPayable: number;
  paymentStatus: 'PENDING' | 'PAID';
  upiDeepLink: string;
}

export interface GroupBillBreakdown {
  cartId?: string;
  restaurantName: string;
  overallTotal: number;
  itemTotal: number;
  deliveryCharge: number;
  taxesAndCharges: number;
  couponDiscount: number;
  couponCode?: string;
  splits: ParticipantSplit[];
  formattedSummary: string;
}
