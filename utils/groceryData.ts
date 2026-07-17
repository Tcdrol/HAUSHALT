// Zambian grocery items with baseline prices and categories
export interface GroceryItem {
  id: string;
  name: string;
  category: 'grains' | 'oils' | 'vegetables' | 'proteins' | 'dairy' | 'household' | 'other';
  unit: string;
  baselinePrice: number; // in ZMW
  lastUpdated: Date;
}

export interface ShoppingListItem {
  id: string;
  item: GroceryItem;
  suggestedPrice: number;
  actualPrice?: number;
  quantity: number;
  added: Date;
  storeId?: string; // Which store this item is planned for
}

export interface MultiStoreBudget {
  id: string;
  location: string;
  items: ShoppingListItem[];
  stores: string[]; // Array of store IDs
  estimatedTotal: number;
  actualTotal?: number;
  date: Date;
  status: 'planning' | 'shopping' | 'completed';
}

export interface GroceryTrip {
  id: string;
  store: string;
  location: string;
  items: ShoppingListItem[];
  estimatedTotal: number;
  actualTotal?: number;
  date: Date;
  status: 'planning' | 'shopping' | 'completed';
}

export interface PriceSuggestion {
  price: number;
  range: { min: number; max: number };
  confidence: 'high' | 'medium' | 'low';
  sampleSize: number;
}

// Zambian grocery database with realistic baseline prices
export const ZAMBIAN_GROCERY_ITEMS: GroceryItem[] = [];

// Store options in Zambia
export const ZAMBIAN_STORES = [
  { id: 'shoprite', name: 'Shoprite', type: 'supermarket' },
  { id: 'picknpay', name: 'Pick n Pay', type: 'supermarket' },
  { id: 'game', name: 'Game', type: 'supermarket' },
  { id: 'spar', name: 'Spar', type: 'supermarket' },
  { id: 'choppies', name: 'Choppies', type: 'supermarket' },
  { id: 'local_market', name: 'Local Market', type: 'market' },
  { id: 'other', name: 'Other', type: 'other' },
];

// Location options - now supports custom locations
export const ZAMBIAN_LOCATIONS = [
  { id: 'kitwe', name: 'Kitwe' },
  { id: 'lusaka', name: 'Lusaka' },
];

// Universal store options - works anywhere
export const UNIVERSAL_STORES = [
  { id: 'shoprite', name: 'Shoprite', type: 'supermarket' },
  { id: 'picknpay', name: 'Pick n Pay', type: 'supermarket' },
  { id: 'game', name: 'Game', type: 'supermarket' },
  { id: 'spar', name: 'Spar', type: 'supermarket' },
  { id: 'choppies', name: 'Choppies', type: 'supermarket' },
  { id: 'local_market', name: 'Local Market', type: 'market' },
  { id: 'street_vendor', name: 'Street Vendor', type: 'market' },
  { id: 'small_shop', name: 'Small Shop', type: 'convenience' },
  { id: 'pharmacy', name: 'Pharmacy', type: 'pharmacy' },
  { id: 'hardware', name: 'Hardware Store', type: 'hardware' },
  { id: 'butcher', name: 'Butcher', type: 'butcher' },
  { id: 'bakery', name: 'Bakery', type: 'bakery' },
  { id: 'other', name: 'Other', type: 'other' },
];

// Custom location interface
export interface CustomLocation {
  id: string;
  name: string;
  province?: string;
  district?: string;
  isCustom: boolean;
}
