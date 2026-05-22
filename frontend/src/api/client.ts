import axios, { AxiosHeaders } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
});

// Set to true during bulk operations (e.g. Excel import) so individual row
// failures don't trigger a global redirect to the login page.
let _suppressAuthRedirect = false;
export const suppressAuthRedirect = (v: boolean) => { _suppressAuthRedirect = v; };

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
  (error) => {
    const status = error.response?.status;
    if (!_suppressAuthRedirect && (status === 401 || status === 403)) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);
