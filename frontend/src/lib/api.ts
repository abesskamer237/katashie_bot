import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Requête — ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Réponse — gérer l'expiration du token
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as any;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, login, logout, user } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          if (data.success) {
            const { setTokens } = useAuthStore.getState();
            setTokens(data.data.accessToken, data.data.refreshToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return axios(original);
          }
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Helpers d'API ─────────────────────────────────────────────
export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (d: any) => api.post('/auth/reset-password', d),
  changePassword: (d: any) => api.put('/auth/change-password', d),
  updateProfile: (d: any) => api.put('/auth/profile', d),
};

export const serverApi = {
  list: () => api.get('/servers'),
  get: (id: string) => api.get(`/servers/${id}`),
  calculate: (d: any) => api.post('/servers/calculate', d),
  create: (d: any) => api.post('/servers', d),
  start: (id: string) => api.post(`/servers/${id}/start`),
  stop: (id: string) => api.post(`/servers/${id}/stop`),
  restart: (id: string) => api.post(`/servers/${id}/restart`),
  delete: (id: string) => api.delete(`/servers/${id}`),
  logs: (id: string) => api.get(`/servers/${id}/logs`),
  updateEnv: (id: string, envVars: Record<string, string>) => api.put(`/servers/${id}/env`, { envVars }),
  qr: (id: string) => api.get(`/servers/${id}/qr`),
};

export const creditApi = {
  packs: () => api.get('/credits/packs'),
  history: (page = 1) => api.get(`/credits/history?page=${page}`),
  balance: () => api.get('/credits/balance'),
  requestPayment: (packId: string) => api.post(`/credits/request/${packId}`),
  requests: () => api.get('/credits/requests'),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const announcementApi = {
  list: () => api.get('/announcements'),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (page = 1, search = '') => api.get(`/admin/users?page=${page}&search=${search}`),
  user: (id: string) => api.get(`/admin/users/${id}`),
  addCredits: (id: string, amount: number, reason?: string) => api.post(`/admin/users/${id}/credits`, { amount, reason }),
  toggleUser: (id: string) => api.post(`/admin/users/${id}/toggle`),
  servers: (page = 1) => api.get(`/admin/servers?page=${page}`),
  deleteServer: (id: string) => api.delete(`/admin/servers/${id}`),
  payments: (page = 1, status = '') => api.get(`/admin/payments?page=${page}&status=${status}`),
  validatePayment: (id: string) => api.post(`/admin/payments/${id}/validate`),
  rejectPayment: (id: string, reason?: string) => api.post(`/admin/payments/${id}/reject`, { reason }),
  packs: () => api.get('/admin/packs'),
  createPack: (d: any) => api.post('/admin/packs', d),
  updatePack: (id: string, d: any) => api.put(`/admin/packs/${id}`, d),
  deletePack: (id: string) => api.delete(`/admin/packs/${id}`),
  logs: (page = 1) => api.get(`/admin/logs?page=${page}`),
  sendNotification: (d: any) => api.post('/admin/notifications', d),
  createAnnouncement: (d: any) => api.post('/admin/announcements', d),
};
