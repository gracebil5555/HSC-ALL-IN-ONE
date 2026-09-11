import { Asset, StockItem, StockMovement } from "@/types/patrimoine.types";
import { apiClient } from "@/lib/apiClient";

export const patrimoineService = {
  getAssets: async (campusId?: string | null): Promise<Asset[]> => {
    try {
      const response = await apiClient.get('/patrimoine/assets/');
      let assets = response.data;
      if (campusId && campusId !== "all") {
        assets = assets.filter((a: any) => a.campus === parseInt(campusId));
      }
      return assets;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  },

  getStocks: async (campusId?: string | null): Promise<StockItem[]> => {
    try {
      const response = await apiClient.get('/patrimoine/consumables/');
      let stocks = response.data;
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
      return response.data;
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
    requestedBy: string // Could map this to user ID later
  ): Promise<StockMovement> => {
    try {
      const payload = {
        item: stockItemId,
        movement_type: type,
        quantity: quantity,
        reason: reason,
        campus: 1 // Defaults to campus 1
      };
      
      const response = await apiClient.post('/patrimoine/movements/', payload);
      return response.data;
    } catch (error) {
      console.error("Error adding stock movement:", error);
      throw error;
    }
  },
};
