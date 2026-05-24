/**
 * Generic envelope returned by every Nexo endpoint.
 * Mirrors `StandardResponse[T, M]` on the backend.
 */
export interface StandardResponse<T, M = unknown | null> {
  Success: boolean;
  Message: string;
  Data: T;
  Metadata?: M | null;
}

export interface ApiErrorPayload {
  detail?: string | Array<{ msg: string; loc?: (string | number)[] }>;
  message?: string;
}
