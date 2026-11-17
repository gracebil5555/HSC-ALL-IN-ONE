import { apiClient } from "@/lib/apiClient";
import { CurrentUser } from "@/types/auth.types";

export const authService = {
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await apiClient.post("/auth/jwt/create/", {
        username,
        password,
      });
      const access = response.data.access;
      const refresh = response.data.refresh;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", access);
        if (refresh) {
          localStorage.setItem("refreshToken", refresh);
        }
      }
      return access;
    } catch (error) {
      console.error("Erreur de connexion", error);
      throw error;
    }
  },

  async refreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return null;

    const response = await apiClient.post("/auth/jwt/refresh/", { refresh });
    const newAccess = response.data?.access;
    if (newAccess) {
      localStorage.setItem("accessToken", newAccess);
      return newAccess;
    }
    return null;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    try {
      const response = await apiClient.get<CurrentUser>("/users/me/");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur", error);
      throw error;
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
};
