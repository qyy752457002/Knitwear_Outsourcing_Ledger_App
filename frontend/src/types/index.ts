export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: string;
  nickname: string;
  phone?: string;
  factory_ids?: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface TodaySummary {
  total_out: number;
  total_in: number;
  diff: number;
}

export interface FactoryItem {
  id: string;
  name: string;
  style_count: number;
  role: 'owner' | 'member';
  created_at: string;
}

export interface FactoryListData {
  today_summary: TodaySummary;
  deleted_count: number;
  list: FactoryItem[];
}

export interface StyleItem {
  id: string;
  style_code: string;
  unit_price: number;
  colors: string[];
  color_count: number;
  created_at: string;
}

export interface StyleListData {
  factory_name: string;
  deleted_count: number;
  list: StyleItem[];
}

export interface RecordItem {
  id: string;
  type: 'out' | 'in';
  date: string;
  items: Record<string, number>;
  remark?: string;
  created_by: string;
  updated_at: string;
}

export interface RecordSummary {
  total_out: number;
  total_in: number;
  diff: number;
  payable: number;
  color_details: Array<{
    color: string;
    out: number;
    in: number;
    diff: number;
  }>;
}

export interface RecordListData {
  style: {
    id: string;
    style_code: string;
    unit_price: number;
    colors: string[];
  };
  records: RecordItem[];
  summary: RecordSummary;
}

export interface StyleStat {
  style_id: string;
  style_code: string;
  unit_price: number;
  total_out: number;
  total_in: number;
  diff: number;
  payable: number;
  color_stats: Array<{
    color: string;
    out: number;
    in: number;
    diff: number;
    diff_label: string;
  }>;
}

export interface FactoryStatsData {
  factory_id: string;
  factory_name: string;
  date_from?: string;
  date_to?: string;
  summary: {
    total_out: number;
    total_in: number;
    diff: number;
    payable: number;
  };
  settlement: {
    status: 'settled' | 'unsettled';
    marked_at?: string;
  };
  style_stats: StyleStat[];
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  FactoryEdit: { factoryId?: string; factoryName?: string };
  StyleList: { factoryId: string; factoryName: string };
  StyleEdit: { factoryId: string; styleId?: string };
  Record: { factoryId: string; styleId: string; styleCode: string };
  MonthlySummary: {
    factoryId: string;
    styleId: string;
    styleCode: string;
    dateFrom?: string;
    dateTo?: string;
  };
  ReconciliationCard: {
    factoryId: string;
    dateFrom?: string;
    dateTo?: string;
  };
  RecycleBin: { type: 'factory' | 'style'; factoryId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Mine: undefined;
};
