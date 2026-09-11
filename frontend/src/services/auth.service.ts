import { apiClient } from "@/lib/apiClient";
import { CurrentUser } from "@/types/auth.types";

export const authService = {
  async login(username: string, password: string):Promise<string> {
    try {
      const response = await apiClient.post('/auth/jwt/create/', {
        username,
        password
      });
      const token = response.data.access;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
      }
      return token;
    } catch (error) {
      console.error("Erreur de connexion", error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<CurrentUser> {
    try {
      const response = await apiClient.get<CurrentUser>('/users/me/');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur", error);
      throw error;
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }
};
