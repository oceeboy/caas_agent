export interface FetchOptions
  extends RequestInit {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  // When true, will attempt token refresh on 401 once and retry
  authRetry?: boolean;
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(
    baseURL = '',
    headers: HeadersInit = {},
  ) {
    this.baseURL = baseURL;
    this.defaultHeaders = headers;
  }

  // Attach Authorization header from localStorage if present
  private withAuthHeader(
    headers?: HeadersInit,
  ): HeadersInit {
    try {
      const token = localStorage.getItem(
        'access_token',
      );
      if (token) {
        return {
          ...(headers ?? {}),
          Authorization: `Bearer ${token}`,
        };
      }
    } catch {}
    return headers ?? {};
  }

  private async request<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const {
      baseURL = this.baseURL,
      timeout = 8000,
      retries = 0,
      authRetry = true,
      ...rest
    } = options;
    const fullUrl = baseURL
      ? `${baseURL}${url}`
      : url;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      timeout,
    );

    try {
      let attempt = 0;
      let refreshed = false;
      while (true) {
        try {
          const res = await fetch(fullUrl, {
            ...rest,
            signal: controller.signal,
            headers: {
              ...this.defaultHeaders,
              ...this.withAuthHeader(
                rest.headers,
              ),
            },
          });

          if (
            res.status === 401 &&
            authRetry &&
            !refreshed
          ) {
            // Try refresh once
            const refreshToken = (() => {
              try {
                return localStorage.getItem(
                  'refresh_token',
                );
              } catch {
                return null;
              }
            })();
            if (refreshToken) {
              try {
                const { refreshAccessToken } =
                  await import(
                    '@/utils/auth.utils'
                  );
                const newAccess =
                  await refreshAccessToken(
                    refreshToken,
                  );
                if (newAccess) {
                  refreshed = true;
                  // retry the original request once with new token
                  continue;
                }
              } catch {}
            }
          }

          if (!res.ok)
            throw new Error(
              `HTTP ${res.status} - ${res.statusText}`,
            );

          // Try to parse JSON automatically
          const contentType = res.headers.get(
            'content-type',
          );
          const data = contentType?.includes(
            'application/json',
          )
            ? await res.json()
            : await res.text();

          return data as T;
        } catch (err) {
          if (attempt < retries) {
            attempt++;
            await new Promise((r) =>
              setTimeout(r, 500 * attempt),
            );
          } else {
            throw err;
          }
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(url: string, options?: FetchOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  post<T>(
    url: string,
    body?: any,
    options?: FetchOptions,
  ) {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  put<T>(
    url: string,
    body?: any,
    options?: FetchOptions,
  ) {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  delete<T>(url: string, options?: FetchOptions) {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Same-origin API client using Next.js rewrites (/api/*)
// export const api = new HttpClient('/api');
