export type AssetCondition = "NEW" | "GOOD" | "MAINTENANCE" | "BROKEN";

export interface Asset {
  id: string;
  asset_code: string; // Ex: "HSC-SON-001"
  name: string;
  department_name: string;
  campus_id: string;
  room: string; // Ex: "Sanctuaire Principal", "Régie Technique", "Salle Pastorale"
  condition: AssetCondition;
  qr_code_url?: string;
  purchase_date: string;
  estimated_value: number; // in FCFA
  notes?: string;
}

export interface StockItem {
  id: string;
  name: string;
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
