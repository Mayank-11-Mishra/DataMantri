export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  organizationId?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  chartCount: number;
  isPublic: boolean;
  thumbnail?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'kpi' | 'area' | 'table';
  title: string;
  data: any;
  config?: ChartConfig;
}

export interface ChartConfig {
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animationDuration?: number;
}

export interface KPIData {
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  period?: string;
  target?: string | number;
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
  }>;
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isInsight?: boolean;
  chartData?: ChartData;
  metadata?: any;
}

export interface ChatbotResponse {
  message: string;
  insights?: string[];
  recommendations?: string[];
  chartData?: ChartData;
  metadata?: any;
}

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  demoLogin: () => Promise<void>;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  dataAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  dataRefreshInterval: number;
  offlineMode: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'bigquery' | 'csv';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  isActive: boolean;
  lastSync?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  sourceId: string;
  destinationId: string;
  status: 'active' | 'inactive' | 'running' | 'failed';
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  lastTriggered?: string;
  dashboardId?: string;
  chartId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'csv' | 'excel';
  includeCharts: boolean;
  includeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ShareOptions {
  method: 'link' | 'email' | 'social';
  permissions: 'view' | 'edit' | 'admin';
  expiration?: string;
  password?: string;
}
