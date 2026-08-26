import {
  User,
  Client,
  Platform,
  Ticket,
  TicketFilters,
  Pagination,
  DashboardKPIs,
  ChartDataResponse
} from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public setAuth(token: string, user: User): void {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }

  public clearAuth(): void {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
  }

  public hasRole(...roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.rol);
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string; pagination?: Pagination }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401 && this.token) {
        this.clearAuth();
      }

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || `Error HTTP ${response.status}`);
      }
      return json;
    } catch (error: any) {
      console.error(`[API ERROR] ${endpoint}:`, error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data) {
      this.setAuth(res.data.token, res.data.user);
    }
    return res;
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  async getDemoAccounts() {
    return this.request<User[]>('/auth/demo-accounts');
  }

  async getTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    return this.request<Ticket[]>(`/tickets?${params.toString()}`);
  }

  async getTicket(id: number | string) {
    return this.request<Ticket>(`/tickets/${id}`);
  }

  async createTicket(data: Partial<Ticket>) {
    return this.request<{ id: number }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTicket(id: number | string, data: Partial<Ticket>) {
    return this.request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async changeTicketStatus(id: number | string, estado: string) {
    return this.request(`/tickets/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    });
  }

  async toggleTicketStatus(id: number | string) {
    return this.request(`/tickets/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteTicket(id: number | string) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE'
    });
  }

  async getClients(search?: string, estado?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado);
    return this.request<Client[]>(`/clientes?${params.toString()}`);
  }

  async createClient(data: Partial<Client>) {
    return this.request<{ id: number }>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateClient(id: number | string, data: Partial<Client>) {
    return this.request(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleClientStatus(id: number | string) {
    return this.request(`/clientes/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteClient(id: number | string) {
    return this.request(`/clientes/${id}`, {
      method: 'DELETE'
    });
  }

  async getPlatforms(search?: string, estado?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado);
    return this.request<Platform[]>(`/plataformas?${params.toString()}`);
  }

  async createPlatform(data: Partial<Platform>) {
    return this.request<{ id: number }>('/plataformas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePlatform(id: number | string, data: Partial<Platform>) {
    return this.request(`/plataformas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async togglePlatformStatus(id: number | string) {
    return this.request(`/plataformas/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deletePlatform(id: number | string) {
    return this.request(`/plataformas/${id}`, {
      method: 'DELETE'
    });
  }

  async getKPIs() {
    return this.request<DashboardKPIs>('/stats/kpis');
  }

  async getCharts(periodo: string = '30d', fecha_desde?: string, fecha_hasta?: string) {
    const params = new URLSearchParams({ periodo });
    if (fecha_desde) params.append('fecha_desde', fecha_desde);
    if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);
    return this.request<ChartDataResponse>(`/stats/charts?${params.toString()}`);
  }

  async getConfig() {
    return this.request<{ list: any[]; map: Record<string, string> }>('/config');
  }

  async updateConfig(clave: string, valor: string, descripcion?: string) {
    return this.request(`/config/${clave}`, {
      method: 'PUT',
      body: JSON.stringify({ valor, descripcion })
    });
  }

  async getUsers() {
    return this.request<User[]>('/usuarios');
  }

  async createUser(data: any) {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateUser(id: number, data: any) {
    return this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(id: number) {
    return this.request(`/usuarios/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleUserStatus(id: number) {
    return this.request(`/usuarios/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  getExportUrl(format: 'excel' | 'csv', filters: TicketFilters = {}): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    return `${API_BASE}/export/${format}?${params.toString()}`;
  }

  async downloadExport(format: 'excel' | 'csv', filters: TicketFilters = {}): Promise<void> {
    const token = this.token || localStorage.getItem('token');
    if (!token) {
      throw new Error('Debes iniciar sesión para exportar reportes.');
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });

    const response = await fetch(`${API_BASE}/export/${format}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let message = 'Error al generar el archivo.';
      try {
        const payload = await response.clone().json();
        message = payload.message || message;
      } catch {
        const fallback = await response.text();
        if (fallback) {
          message = fallback;
        }
      }
      throw new Error(message);
    }

    const contentDisposition = response.headers.get('content-disposition') || '';
    const fileNameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    const filename = fileNameMatch ? fileNameMatch[1] : `reporte.${extension}`;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

export const api = new ApiService();
