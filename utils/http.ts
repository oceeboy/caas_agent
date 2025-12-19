export interface FetchOptions
  extends RequestInit {
  baseURL?: string;
  timeout?: number;
  retries?: number;
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

  private async request<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const {
      baseURL = this.baseURL,
      timeout = 8000,
      retries = 0,
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
      while (true) {
        try {
          const res = await fetch(fullUrl, {
            ...rest,
            signal: controller.signal,
            headers: {
              ...this.defaultHeaders,
              ...rest.headers,
            },
          });

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

// Example usage:
// export const api = new HttpClient(
//   'https://api.example.com',
//   {
//     Authorization: 'Bearer token',
//   },
// );
