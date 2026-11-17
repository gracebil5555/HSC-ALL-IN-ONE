export type AssetCondition =
  | "NEW"
  | "GOOD"
  | "FAIR"
  | "MAINTENANCE"
  | "DAMAGED"
  | "BROKEN"
  | "LOST";

export type AssetMovementType =
  | "ASSIGNMENT"
  | "TRANSFER"
  | "MAINTENANCE"
  | "INSPECTION";

export interface AssetMovement {
  id: number | string;
  asset: number | string;
  asset_name?: string;
  asset_code?: string;
  campus: number;
  movement_type: AssetMovementType;
  movement_type_display?: string;
  from_location: string;
  to_location: string;
  observed_condition: AssetCondition;
  observed_condition_display?: string;
  movement_date: string;
  responsible?: number | null;
  responsible_name?: string;
  notes?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_code: string; // Ex: "HSC-SON-001"
  name: string;
  category?: string;
  department?: number | null;
  department_name: string;
  campus?: number;
  campus_id: string;
  campus_name?: string;
  location?: string;
  room: string; // Ex: "Sanctuaire Principal", "Régie Technique", "Salle Pastorale"
  condition: AssetCondition;
  qr_code_url?: string;
  purchase_date: string;
  purchase_price?: number | string | null;
  useful_life_years?: number;
  depreciation_rate?: number | string | null;
  effective_depreciation_rate?: number;
  accumulated_depreciation?: number;
  net_book_value?: number;
  estimated_value: number; // in FCFA
  description?: string;
  notes?: string;
  is_active?: boolean;
  movements?: AssetMovement[];
}

export interface StockItem {
  id: string;
  name: string;
  campus?: number;
  campus_id: string;
  quantity_in_stock: number;
  alert_threshold: number;
  category: "ENVELOPPES" | "LIVRETS" | "LOGISTIQUE" | "COMMUNION";
  unit: string;
}

export interface StockMovement {
  id: string;
  stock_item_id: string;
  stock_item_name: string;
  movement_type: "IN" | "OUT";
  quantity: number;
  reason: string;
  requested_by_name: string;
  created_at: string;
}
