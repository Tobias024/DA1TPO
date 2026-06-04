import { api } from './client';
import type {
  Auction, AuctionPage, Bid, BidPage, BidRequest, Consignment, CreateConsignmentRequest,
  LoginRequest, LoginResponse, MedioPago, AddPaymentMethodRequest, Notification,
  NotificationPage, Piece, Sale, UserMetrics, UserProfile, WonItem, CheckoutDetail, PayRequest,
} from '@/types/api';

// ─── AUTH ────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body).then((r) => r.data),

  registerStep1: (body: Record<string, unknown>) =>
    api.post<{ message: string; registrationId: string; registrationToken: string }>('/auth/register/step1', body).then((r) => r.data),

  registerStatus: (registrationId: string) =>
    api.get<{ estado: string; listoParaCompletar: boolean; registrationToken: string | null }>(
      `/auth/register/${registrationId}/status`,
    ).then((r) => r.data),

  registerStep2: (body: { registrationToken: string; password: string; passwordConfirm: string }) =>
    api.post<LoginResponse>('/auth/register/step2', body).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),
};

// ─── USERS ───────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get<UserProfile>('/users/me').then((r) => r.data),
  updateMe: (body: Partial<UserProfile>) =>
    api.put<UserProfile>('/users/me', body).then((r) => r.data),
  metrics: () => api.get<UserMetrics>('/users/me/metrics').then((r) => r.data),
  payFine: (body: { medioPagoId?: string } = {}) =>
    api.post<{ message: string; tieneMulta: boolean }>('/users/me/fine/pay', body).then((r) => r.data),
};

// ─── AUCTIONS ────────────────────────────────────────────────────────
export const auctionsApi = {
  list: (params: { estado?: string; page?: number; size?: number } = {}) =>
    api.get<AuctionPage>('/auctions', { params }).then((r) => r.data),
  detail: (id: string) => api.get<Auction>(`/auctions/${id}`).then((r) => r.data),
  catalog: (id: string) =>
    api.get<Piece[]>(`/auctions/${id}/catalog`).then((r) => (Array.isArray(r.data) ? r.data : [])),
  join: (id: string) =>
    api.post<{ message: string; puedePujar: boolean }>(`/auctions/${id}/join`).then((r) => r.data),
  leave: (id: string) =>
    api.post<{ message: string }>(`/auctions/${id}/leave`).then((r) => r.data),
};

// ─── BIDS ────────────────────────────────────────────────────────────
export const bidsApi = {
  history: (auctionId: string, page = 0, size = 50) =>
    api.get<BidPage>(`/auctions/${auctionId}/bids`, { params: { page, size } }).then((r) => r.data),
  place: (auctionId: string, body: BidRequest) =>
    api.post<Bid>(`/auctions/${auctionId}/bids`, body).then((r) => r.data),
};

// ─── PAYMENT METHODS ─────────────────────────────────────────────────
export const paymentsApi = {
  list: () => api.get<MedioPago[]>('/payment-methods').then((r) => r.data),
  add: (body: AddPaymentMethodRequest) =>
    api.post<MedioPago>('/payment-methods', body).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/payment-methods/${id}`).then((r) => r.data),
};

// ─── CONSIGNMENTS ────────────────────────────────────────────────────
export const consignmentsApi = {
  list: () => api.get<Consignment[]>('/consignments').then((r) => r.data),
  detail: (id: string) => api.get<Consignment>(`/consignments/${id}`).then((r) => r.data),
  create: (body: CreateConsignmentRequest) =>
    api.post<Consignment>('/consignments', body).then((r) => r.data),
  acceptOffer: (id: string) =>
    api.patch<Consignment>(`/consignments/${id}/accept-offer`).then((r) => r.data),
  rejectOffer: (id: string, motivo?: string) =>
    api.patch<Consignment>(`/consignments/${id}/reject-offer`, { motivo }).then((r) => r.data),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────
export const notificationsApi = {
  list: (page = 0, size = 20) =>
    api.get<NotificationPage>('/notifications', { params: { page, size } }).then((r) => r.data),
  markRead: (id: string) =>
    api.patch<void>(`/notifications/${id}/read`).then((r) => r.data),
};

// ─── SALES ───────────────────────────────────────────────────────────
export const salesApi = {
  list: () => api.get<Sale[]>('/sales').then((r) => r.data),
  won: () => api.get<WonItem[]>('/sales/won').then((r) => r.data),
  checkout: (piezaId: string) =>
    api.get<CheckoutDetail>(`/sales/won/${piezaId}/checkout`).then((r) => r.data),
  pay: (piezaId: string, body: PayRequest) =>
    api.post<{ message: string; venta: Sale }>(`/sales/won/${piezaId}/pay`, body).then((r) => r.data),
};
