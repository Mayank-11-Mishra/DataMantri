const API_BASE_URL = 'http://localhost:5000';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  chartCount: number;
  isPublic: boolean;
  thumbnail?: string;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'kpi';
  title: string;
  data: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          error: data.message || 'An error occurred',
        };
      }

      return {
        status: 'success',
        data,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async demoLogin(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/demo-login', {
      method: 'POST',
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/logout', {
      method: 'POST',
    });
  }

  async getSession(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/session');
  }

  // Dashboards
  async getDashboards(): Promise<ApiResponse<Dashboard[]>> {
    return this.request<Dashboard[]>('/api/dashboards');
  }

  async getDashboard(id: string): Promise<ApiResponse<Dashboard>> {
    return this.request<Dashboard>(`/api/dashboards/${id}`);
  }

  async getDashboardData(id: string): Promise<ApiResponse<ChartData[]>> {
    return this.request<ChartData[]>(`/api/dashboards/${id}/data`);
  }

  // Chatbot
  async sendChatMessage(message: string): Promise<ApiResponse<string>> {
    return this.request<string>('/api/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // User Profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
