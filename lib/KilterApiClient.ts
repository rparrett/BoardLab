const API_BASE_URL = 'https://kilterboardapp.com';
const USER_AGENT =
  'Dalvik/2.1.0 (Linux; U; Android 14; Android SDK built for x86_64 Build/UE1A.230829.036.A1)';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

class KilterApiClient {
  private logRequest(method: string, url: string, body?: any) {
    const bodyLength = body ? JSON.stringify(body).length : 0;
    const bodyInfo = bodyLength > 0 ? ` (${bodyLength} bytes)` : '';
    console.log(`${method} ${url}${bodyInfo}`);
  }

  private logResponse(status: number, responseLength: number) {
    console.log(`HTTP ${status} (${responseLength} bytes)`);
  }

  private buildHeaders(options: ApiRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      Connection: 'keep-alive',
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      ...options.headers,
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.token) {
      headers.Cookie = `token=${options.token}`;
    }

    return headers;
  }

  private buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }

  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body } = options;
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options);

    this.logRequest(method, url, body);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit',
      });

      const responseText = await response.text();
      this.logResponse(response.status, responseText.length);

      let data: T;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(
    endpoint: string,
    options: Omit<ApiRequestOptions, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body: any,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(
    endpoint: string,
    body: any,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(
    endpoint: string,
    options: Omit<ApiRequestOptions, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export { KilterApiClient };
export type { ApiResponse };
