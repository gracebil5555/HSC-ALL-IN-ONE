import { Asset, StockItem, StockMovement } from "@/types/patrimoine.types";
import { MOCK_ASSETS, MOCK_STOCKS, MOCK_MOVEMENTS } from "@/mocks/patrimoine.mock";

const assetsDb: Asset[] = [...MOCK_ASSETS];
const stocksDb: StockItem[] = [...MOCK_STOCKS];
let movementsDb: StockMovement[] = [...MOCK_MOVEMENTS];

export const patrimoineService = {
  getAssets: async (campusId?: string | null): Promise<Asset[]> => {
    await new Promise((res) => setTimeout(res, 80));
    if (!campusId || campusId === "all") return [...assetsDb];
    return assetsDb.filter((a) => a.campus_id === campusId);
  },

  getStocks: async (campusId?: string | null): Promise<StockItem[]> => {
    await new Promise((res) => setTimeout(res, 80));
    if (!campusId || campusId === "all") return [...stocksDb];
    return stocksDb.filter((s) => s.campus_id === campusId);
  },

  getMovements: async (): Promise<StockMovement[]> => {
    await new Promise((res) => setTimeout(res, 60));
    return [...movementsDb];
  },

  addStockMovement: async (
    stockItemId: string,
    type: "IN" | "OUT",
    quantity: number,
    reason: string,
    requestedBy: string
  ): Promise<StockMovement> => {
    await new Promise((res) => setTimeout(res, 100));
    const stockIndex = stocksDb.findIndex((s) => s.id === stockItemId);
    if (stockIndex !== -1) {
      if (type === "IN") {
        stocksDb[stockIndex].quantity_in_stock += quantity;
      } else {
        stocksDb[stockIndex].quantity_in_stock = Math.max(
          0,
          stocksDb[stockIndex].quantity_in_stock - quantity
        );
      }
    }

    const stock = stocksDb[stockIndex];
    const movement: StockMovement = {
      id: `mvt-${Date.now().toString().slice(-4)}`,
      stock_item_id: stockItemId,
      stock_item_name: stock ? stock.name : "Article",
      movement_type: type,
      quantity,
      reason,
      requested_by_name: requestedBy,
      created_at: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    movementsDb = [movement, ...movementsDb];
    return movement;
  },
};
