export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  dob?: string;
  gender?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  exists?: boolean;
  verified?: boolean;
  token?: string;
}

export interface ThriveLocation {
  id: string;
  name: string;
  currency: string;
  location_type: string | null;
  address: string | null;
  phone: string | null;
  status: string;
}

export interface ThriveIngredientOption {
  id: string;
  name: string;
  location_id: string | null;
  is_global: boolean;
}

export interface ThriveIngredientPhoto {
  id: string;
  photo_url: string;
  display_order: number;
}

export interface ThriveIngredientQuantity {
  id: string;
  quantity_value: string;
  quantity_grams: number | null;
  price: number;
  is_available: boolean;
  currency: string;
}

export interface ThriveIngredient {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_global: boolean;
  location_id: string | null;
  location_name: string | null;
  category_id: string | null;
  category_name: string;
  food_type_id: string | null;
  food_type_name: string | null;
  specifications: ThriveIngredientOption[];
  cook_types: ThriveIngredientOption[];
  photo_url: string | null;
  photos: ThriveIngredientPhoto[];
  quantities: ThriveIngredientQuantity[];
  default_quantity: ThriveIngredientQuantity | null;
  show_specification: boolean;
  show_cook_type: boolean;
}

export interface ThriveFoodTypeSummary {
  id: string;
  source_id: string;
  name: string;
  category_id: string | null;
  location_id: string | null;
  is_global: boolean;
  ingredient_count: number;
}

export interface ThriveIngredientCategory {
  category_id: string | null;
  category_name: string;
  display_order: number;
  show_specification: boolean;
  show_cook_type: boolean;
  location_id: string | null;
  is_global: boolean;
  ingredient_count: number;
  food_types: ThriveFoodTypeSummary[];
  ingredients: ThriveIngredient[];
}

export interface ThriveIngredientsMeta {
  location: ThriveLocation;
  filters: {
    location_id: string;
    category_id: string | null;
    category_name: string | null;
    search: string | null;
    include_inactive: boolean;
    include_empty_categories: boolean;
  };
  total_categories: number;
  total_ingredients: number;
}

export interface ThriveLocationsResponse {
  success: boolean;
  count: number;
  data: ThriveLocation[];
}

export interface ThriveIngredientsResponse {
  success: boolean;
  meta: ThriveIngredientsMeta;
  data: ThriveIngredientCategory[];
}

export interface PlateItemMacros {
  protein: number;
  carbs: number;
  fats: number;
  kcal: number;
}

export interface PlateItem {
  id: string;
  ingredient_id: string;
  name: string;
  specification: string;
  quantity_label: string;
  grams: number;
  cook_style: string;
  price: number;
  currency: string;
  image: string | null;
  macros: PlateItemMacros;
}

export interface CustomerOrderDraft {
  meal_name: string;
  location_id: string;
  location_name: string;
  total_price: number;
  delivery_type: 'now' | 'schedule';
  plate_items: PlateItem[];
  created_at: string;
}

export interface FoodOsOrderMetadata {
  source: 'thrive-food-os';
  meal_name: string;
  delivery_type: 'now' | 'schedule';
  location_name: string;
  total_price: number;
  created_at: string;
  realtime_token?: string;
  plate_items: PlateItem[];
}

export interface FoodOsCreateOrderPayload {
  location_id: string;
  notes?: string;
  items: {
    menu_item_id?: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
}

export interface ChefUser {
  id: string;
  location_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'kitchen_staff';
  account_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  location_name?: string;
}

export interface ChefSession {
  token: string;
  user: ChefUser;
}

export type ChefOrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface ChefOrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  menu_item_name?: string | null;
  menu_item_description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string | null;
  created_at: string;
}

export interface ChefOrder {
  id: string;
  location_id: string;
  customer_id?: string | null;
  order_number?: string;
  status: ChefOrderStatus;
  total_price: number;
  notes?: string | null;
  order_date: string;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  location_name?: string | null;
  items?: ChefOrderItem[];
  metadata?: FoodOsOrderMetadata | null;
}
