import { Asset, AssetMovement, StockItem, StockMovement } from "@/types/patrimoine.types";
import { apiClient } from "@/lib/apiClient";
import { extractPaginatedResults } from "@/lib/utils";

export const patrimoineService = {
  getAssets: async (campusId?: string | null): Promise<Asset[]> => {
    try {
      const response = await apiClient.get('/patrimoine/assets/');
      let assets = extractPaginatedResults<Asset>(response.data);
      if (campusId && campusId !== "all") {
        assets = assets.filter((a: any) => a.campus === parseInt(campusId));
      }
      return assets;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  },

  createAsset: async (data: Record<string, any>): Promise<Asset> => {
    const response = await apiClient.post('/patrimoine/assets/', data);
    return response.data;
  },

  updateAsset: async (id: string | number, data: Record<string, any>): Promise<Asset> => {
    const response = await apiClient.patch(`/patrimoine/assets/${id}/`, data);
    return response.data;
  },

  getAssetMovements: async (assetId?: string | number): Promise<AssetMovement[]> => {
    try {
      const response = await apiClient.get('/patrimoine/asset-movements/', {
        params: assetId ? { asset_id: assetId } : undefined,
      });
      return extractPaginatedResults<AssetMovement>(response.data);
    } catch (error) {
      console.error("Error fetching asset movements:", error);
      return [];
    }
  },

  createAssetMovement: async (data: {
    asset: number | string;
    movement_type: string;
    from_location?: string;
    to_location?: string;
    observed_condition: string;
    movement_date?: string;
    notes?: string;
  }): Promise<AssetMovement> => {
    const response = await apiClient.post('/patrimoine/asset-movements/', data);
    return response.data;
  },

  getStocks: async (campusId?: string | null): Promise<StockItem[]> => {
    try {
      const response = await apiClient.get('/patrimoine/consumables/');
      let stocks = extractPaginatedResults<StockItem>(response.data);
      if (campusId && campusId !== "all") {
        stocks = stocks.filter((s: any) => s.campus === parseInt(campusId));
      }
      return stocks;
    } catch (error) {
      console.error("Error fetching stocks:", error);
      return [];
    }
  },

  getMovements: async (): Promise<StockMovement[]> => {
    try {
      const response = await apiClient.get('/patrimoine/movements/');
      return extractPaginatedResults<StockMovement>(response.data);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      return [];
    }
  },

  addStockMovement: async (
    stockItemId: string,
    type: "IN" | "OUT",
    quantity: number,
    reason: string,
    requestedBy: string
  ): Promise<StockMovement> => {
    try {
      const payload = {
        item: stockItemId,
        movement_type: type,
        quantity: quantity,
        reason: reason,
      };
      const response = await apiClient.post('/patrimoine/movements/', payload);
      return response.data;
    } catch (error) {
      console.error("Error adding stock movement:", error);
      throw error;
    }
  },
};
