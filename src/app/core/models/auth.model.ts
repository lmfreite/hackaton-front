export interface LoginRequest {
  Email: string;
  Password: string;
  TwoFACode?: string | null;
}

export interface LoginResponse {
  Authenticated: boolean;
}

export interface LogoutResponse {
  Authenticated: boolean;
}

export interface AuthStatusResponse {
  Authenticated: boolean;
  UserId: string;
  Email: string;
}

export interface UserResponse {
  Id: string;
  Email: string;
  Firstname: string;
  Lastname: string;
  Fullname: string;
  TwoFAEnabled: boolean;
}
