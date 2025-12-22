declare module '@/services' {
  export function login(
    data: LoginData,
  ): Promise<LoginResponse>;
  export function fetchUserDetails(): Promise<AuthUser>;
  export function refreshToken(): Promise<RefreshTokenResponse>;
  export function getNewAccessToken(
    refreshToken: string,
  ): Promise<string | null>;
}
