export type SortOrder = 'asc' | 'desc';

export type SortField = string;

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
  sortField?: SortField;
  search?: string;
  filter?: Record<string, unknown>;
}

export interface DateRange {
  start: string;
  end: string;
}

export type ID = string;

export type Timestamp = string;

export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
