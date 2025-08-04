# Fetcher-TS
`fetcher` is a versatile JavaScript utility built on `fetch` that supports GET, POST, PUT, DELETE with features like caching, retries, timeout, detailed error handling, debug logs, loading indicators, and middleware, simplifying API requests in web apps.


---

# 📘 Complete Usage Guide for `fetcher` Tool

---

## 1. **What is `fetcher`?**

`fetcher` is a JavaScript/TypeScript utility built on top of the native `fetch` API, enhanced with features such as:

* HTTP methods support: GET, POST, PUT, DELETE
* Cache management and revalidation
* Request timeout with automatic abort
* Automatic retry on failure with configurable attempts
* Detailed error handling (client/server errors)
* Automatic content-type detection (JSON/Text/Blob)
* Debug mode with detailed logs including execution time
* Loading indicator support (works in console and can be linked to React UI)
* Middleware support (before and after requests)
* Internal rate limiting to avoid repeated rapid requests
* Global settings like BaseURL and Authorization token

---

## 2. **How to import the tool**

```tsx
import { fetcher } from "./path/to/fetcher";
```

---

## 3. **Basic configuration**

```tsx
// Set a base URL for all requests
fetcher.setBaseURL("https://api.example.com");

// Set authorization token
fetcher.setToken("your-jwt-token");

// Add a middleware before request (optional)
fetcher.addMiddleware("before", (url, options) => {
  console.log("Requesting:", url);
});

// Add a middleware after request (optional)
fetcher.addMiddleware("after", (url, data) => {
  console.log("Received response from:", url, data);
});
```

---

## 4. **Request methods**

Each method returns a Promise resolving to the response data (supports TypeScript generics):

### GET

```tsx
const data = await fetcher.get<T>(
  url: string,
  cache: CacheMode = "default",    // Cache strategy
  debug: boolean = false,           // Enable debug mode (console logs)
  revalidateAfter?: number,         // Revalidate after X seconds
  timeout?: number,                 // Timeout in milliseconds (default 8000)
  retries?: number,                 // Number of retry attempts (default 1)
  showLoading?: boolean             // Show loading indicator (console + React UI)
);
```

### POST

```tsx
const data = await fetcher.post<T>(
  url: string,
  body?: any,                      // Request body (auto JSON.stringified)
  debug?: boolean,
  timeout?: number,
  retries?: number,
  showLoading?: boolean
);
```

### PUT

```tsx
const data = await fetcher.put<T>(
  url: string,
  body?: any,
  debug?: boolean,
  timeout?: number,
  retries?: number,
  showLoading?: boolean
);
```

### DELETE

```tsx
const data = await fetcher.delete<T>(
  url: string,
  debug?: boolean,
  timeout?: number,
  retries?: number,
  showLoading?: boolean
);
```

---

## 5. **Request options (`FetchOptions`)**

| Property          | Type                     | Description                                                                       | Default                                |            |                  |         |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------- | -------------------------------------- | ---------- | ---------------- | ------- |
| `method`          | \`"GET"                  | "POST"                                                                            | "PUT"                                  | "DELETE"\` | HTTP method type | `"GET"` |
| `headers`         | `Record<string, string>` | Custom headers for the request                                                    | `{"Content-Type": "application/json"}` |            |                  |         |
| `body`            | `any`                    | Request body (auto converts to JSON or FormData)                                  | `undefined`                            |            |                  |         |
| `cache`           | `CacheMode`              | Cache mode (`"default"`, `"no-store"`, `"reload"`, `"no-cache"`, `"force-cache"`) | `"default"`                            |            |                  |         |
| `debug`           | `boolean`                | Enable detailed console logs (URL, Body, Response, Execution Time)                | `false`                                |            |                  |         |
| `revalidateAfter` | `number`                 | Revalidate cached data after this many seconds                                    | `undefined`                            |            |                  |         |
| `timeout`         | `number`                 | Request timeout in milliseconds                                                   | `8000`                                 |            |                  |         |
| `retries`         | `number`                 | Number of retry attempts on failure                                               | `1`                                    |            |                  |         |
| `showLoading`     | `boolean`                | Show loading indicator (console + React UI)                                       | `false`                                |            |                  |         |

---

## 6. **Complete practical example**

```tsx
import React, { useState, useEffect } from "react";
import { fetcher } from "./utils/fetcher";

export default function AboutSection() {
  const [about, setAbout] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to loading indicator
    fetcher.onLoading((isLoading, url) => {
      console.log(`Loading state for ${url}: ${isLoading}`);
      setLoading(isLoading);
    });

    // Fetch data with debug enabled, retries, timeout, and loading indicator
    fetcher.get<string>(
      "/about",
      "default",   // Cache mode
      true,        // Enable debug mode
      30,          // Revalidate after 30 seconds
      5000,        // Timeout 5 seconds
      3,           // Retry 3 times
      true         // Show loading indicator
    )
    .then(setAbout)
    .catch(err => {
      console.error(err);
      setError("Failed to load data");
    });
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <p className="text-blue-500">⏳ Loading...</p>;

  return <section>{about}</section>;
}
```

---

## 7. **Error handling**

* Throws an Error on request failure (HTTP 4xx, 5xx, timeout, etc.)
* Automatically retries request up to the configured number of attempts
* Returns last successful cached response as a fallback (if any)
* Catch errors with `.catch()` or `try...catch` when using `await`

---

## 8. **Adding middleware**

```tsx
fetcher.addMiddleware("before", (url, options) => {
  console.log("Before request:", url);
});

fetcher.addMiddleware("after", (url, data) => {
  console.log("After request:", url, data);
});
```

---

## 9. **Set Base URL and Token**

```tsx
fetcher.setBaseURL("https://api.example.com");
fetcher.setToken("Bearer eyJhbGciOiJI..."); 
```

---

## 10. **Using the loading indicator in React**

```tsx
const [loading, setLoading] = React.useState(false);

React.useEffect(() => {
  fetcher.onLoading((isLoading, url) => {
    setLoading(isLoading);
  });

  fetcher.get("/data", "default", false, undefined, 5000, 2, true)
    .then(console.log);
}, []);

return loading ? <div>Loading...</div> : <div>Data loaded</div>;
```

---

## 11. **Tips and best practices**

* Use `cache: "no-store"` for POST/PUT/DELETE to avoid unwanted caching.
* Keep retry attempts reasonable to avoid server overload.
* Use timeout to prevent hanging requests.
* Enable debug mode during development only.
* Use middleware for centralized token handling or header modifications.

---

# End of Guide ✨
