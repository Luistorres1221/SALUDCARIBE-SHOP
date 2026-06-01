import axios, { AxiosHeaders } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
});

// Separate instance without interceptors — used exclusively for the token refresh call
// so a failed refresh doesn't re-trigger the refresh logic recursively.
const _rawAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
});

// Set to true during bulk operations (e.g. Excel import) so individual row
// failures don't trigger a global redirect to the login page.
let _suppressAuthRedirect = false;
export const suppressAuthRedirect = (v: boolean) => { _suppressAuthRedirect = v; };

let _isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let _queue: QueueEntry[] = [];

function _flushQueue(err: unknown, token: string | null) {
  _queue.forEach((e) => err ? e.reject(err) : e.resolve(token!));
  _queue = [];
}

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  const token = localStorage.getItem("accessToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (config.data instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (!_suppressAuthRedirect && status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        _clearAndRedirect();
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        // Another refresh is already in progress — queue this request until it resolves.
        return new Promise((resolve, reject) => {
          _queue.push({
            resolve: (token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const res = await _rawAxios.post<{
          accessToken: string;
          refreshToken: string;
          userId: string;
          email: string;
          fullName: string;
          area: string | null;
          roles: string[];
        }>("/api/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRefresh, userId, email, fullName, area, roles } = res.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        localStorage.setItem("authUser", JSON.stringify({ id: userId, email, fullName, area, roles }));

        _flushQueue(null, accessToken);
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        _flushQueue(refreshError, null);
        _clearAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function _clearAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
  window.location.href = "/auth";
}
