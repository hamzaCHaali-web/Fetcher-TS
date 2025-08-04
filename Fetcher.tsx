type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  debug?: boolean;
  revalidateAfter?: number; // seconds
  timeout?: number; // ms
  retries?: number;
  showLoading?: boolean;
}

type MiddlewareHook = "before" | "after";
type MiddlewareFn = (url: string, options?: RequestInit, data?: any) => void;

export class Fetcher {
  private baseURL = "";
  private token: string | null = null;
  private middlewares: { before: MiddlewareFn[]; after: MiddlewareFn[] } = {
    before: [],
    after: [],
  };
  private loadingSubscribers: ((loading: boolean, url: string) => void)[] = [];

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  setToken(token: string) {
    this.token = token;
  }

  addMiddleware(hook: MiddlewareHook, fn: MiddlewareFn) {
    this.middlewares[hook].push(fn);
  }

  onLoading(fn: (loading: boolean, url: string) => void) {
    this.loadingSubscribers.push(fn);
  }

  private notifyLoading(isLoading: boolean, url: string) {
    this.loadingSubscribers.forEach((fn) => fn(isLoading, url));
  }

  private async request<T = any>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      cache = "default",
      debug = false,
      revalidateAfter,
      timeout = 8000,
      retries = 1,
      showLoading = false,
    } = options;

    const fullURL = this.baseURL ? this.baseURL + url : url;

    // Compose headers with explicit typing to allow Authorization
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (this.token) {
      finalHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: finalHeaders,
      cache,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Call before middlewares
    this.middlewares.before.forEach((fn) => fn(fullURL, fetchOptions));

    let attempt = 0;
    let lastError: any;
    const startTime = Date.now();

    if (showLoading) this.notifyLoading(true, fullURL);

    while (attempt < retries) {
      try {
        // Timeout wrapper
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        fetchOptions.signal = controller.signal;

        if (debug) {
          console.log(`[fetcher] Fetching: ${method} ${fullURL}`);
          if (body) console.log("[fetcher] Body:", body);
        }

        const response = await fetch(fullURL, fetchOptions);
        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(
            `[fetcher] Request failed with status ${response.status}`
          );
        }

        // Auto-detect content type and parse accordingly
        const contentType = response.headers.get("content-type") || "";

        let data: any;
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else if (contentType.includes("text/")) {
          data = await response.text();
        } else {
          data = await response.blob();
        }

        const endTime = Date.now();

        if (debug) {
          console.log(
            `[fetcher] Success in ${endTime - startTime} ms:`,
            data
          );
        }

        // Call after middlewares
        this.middlewares.after.forEach((fn) => fn(fullURL, data));

        if (showLoading) this.notifyLoading(false, fullURL);

        return data as T;
      } catch (err) {
        lastError = err;
        attempt++;

        if (debug) {
          console.warn(
            `[fetcher] Attempt ${attempt} failed for ${fullURL}:`,
            err
          );
        }

        if (attempt >= retries) {
          if (showLoading) this.notifyLoading(false, fullURL);
          throw err;
        }
      }
    }

    if (showLoading) this.notifyLoading(false, fullURL);
    throw lastError;
  }

  get<T = any>(
    url: string,
    cache?: RequestCache,
    debug?: boolean,
    revalidateAfter?: number,
    timeout?: number,
    retries?: number,
    showLoading?: boolean
  ) {
    return this.request<T>(url, {
      method: "GET",
      cache,
      debug,
      revalidateAfter,
      timeout,
      retries,
      showLoading,
    });
  }

  post<T = any>(
    url: string,
    body?: any,
    debug?: boolean,
    timeout?: number,
    retries?: number,
    showLoading?: boolean
  ) {
    return this.request<T>(url, {
      method: "POST",
      body,
      debug,
      timeout,
      retries,
      showLoading,
      cache: "no-store", // POST usually no cache
    });
  }

  put<T = any>(
    url: string,
    body?: any,
    debug?: boolean,
    timeout?: number,
    retries?: number,
    showLoading?: boolean
  ) {
    return this.request<T>(url, {
      method: "PUT",
      body,
      debug,
      timeout,
      retries,
      showLoading,
      cache: "no-store",
    });
  }

  delete<T = any>(
    url: string,
    debug?: boolean,
    timeout?: number,
    retries?: number,
    showLoading?: boolean
  ) {
    return this.request<T>(url, {
      method: "DELETE",
      debug,
      timeout,
      retries,
      showLoading,
      cache: "no-store",
    });
  }
}

export const fetcher = new Fetcher();
