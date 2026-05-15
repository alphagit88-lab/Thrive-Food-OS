import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

const LOCAL_API_PORT = '5000';
const HOSTED_THRIVE_BACKEND_ORIGIN = 'https://thrive-backend-five.vercel.app';
const HOSTED_THRIVE_BACKEND_API_BASE_URL = `${HOSTED_THRIVE_BACKEND_ORIGIN}/api`;

const isLocalHostname = (hostname?: string | null) => {
  if (!hostname) {
    return false;
  }

  const normalizedHostname = hostname.trim().toLowerCase();

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1'
  ) {
    return true;
  }

  return (
    /^10(?:\.\d{1,3}){3}$/.test(normalizedHostname) ||
    /^192\.168(?:\.\d{1,3}){2}$/.test(normalizedHostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(normalizedHostname)
  );
};

const getLocalApiBaseUrl = () => {
  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    return `http://${window.location.hostname}:${LOCAL_API_PORT}/api`;
  }

  return `http://localhost:${LOCAL_API_PORT}/api`;
};

const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    return getLocalApiBaseUrl();
  }

  return import.meta.env.DEV ? getLocalApiBaseUrl() : '/api';
};

const DEFAULT_API_BASE_URL = getDefaultApiBaseUrl();
const HAS_EXPLICIT_API_BASE_URL = Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
const SHOULD_TRY_HOSTED_API_FALLBACK =
  !HAS_EXPLICIT_API_BASE_URL && DEFAULT_API_BASE_URL === getLocalApiBaseUrl();

const normalizeApiBaseUrl = (value?: string) => {
  const candidate = value?.trim();

  if (!candidate) {
    return DEFAULT_API_BASE_URL;
  }

  const withoutTrailingSlashes = candidate.replace(/\/+$/, '');

  if (!withoutTrailingSlashes) {
    return DEFAULT_API_BASE_URL;
  }

  if (withoutTrailingSlashes === '/api' || /\/api$/i.test(withoutTrailingSlashes)) {
    return withoutTrailingSlashes;
  }

  return `${withoutTrailingSlashes}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const API_ORIGIN = API_BASE_URL === '/api' ? '' : API_BASE_URL.replace(/\/api$/, '');
export const HOSTED_API_ORIGIN = HOSTED_THRIVE_BACKEND_ORIGIN;

if (!import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL && typeof window !== 'undefined' && !isLocalHostname(window.location.hostname)) {
  console.warn(
    'VITE_API_BASE_URL is not set. API requests are using /api on the current site origin.',
  );
}

export const resolveApiAssetUrl = (value?: string | null, apiOrigin = API_ORIGIN) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${apiOrigin}${value}`;
  }

  return `${apiOrigin}/${value}`;
};

const isNetworkLevelAxiosError = (error: unknown): error is AxiosError =>
  axios.isAxiosError(error) && !error.response;

let hasLoggedHostedApiFallback = false;

export const requestWithHostedApiFallback = async <T>(
  config: AxiosRequestConfig,
): Promise<{ response: AxiosResponse<T>; apiOrigin: string }> => {
  try {
    return {
      response: await API.request<T>(config),
      apiOrigin: API_ORIGIN,
    };
  } catch (error) {
    if (!SHOULD_TRY_HOSTED_API_FALLBACK || !isNetworkLevelAxiosError(error)) {
      throw error;
    }

    if (!hasLoggedHostedApiFallback) {
      console.warn(
        `Primary API at ${API_BASE_URL} is unreachable. Retrying requests against ${HOSTED_THRIVE_BACKEND_API_BASE_URL}.`,
      );
      hasLoggedHostedApiFallback = true;
    }

    return {
      response: await API.request<T>({
        ...config,
        baseURL: HOSTED_THRIVE_BACKEND_API_BASE_URL,
      }),
      apiOrigin: HOSTED_API_ORIGIN,
    };
  }
};

export const requestWithHostedCatalogFallback = async <T>(
  config: AxiosRequestConfig,
): Promise<{ response: AxiosResponse<T>; apiOrigin: string }> =>
  requestWithHostedApiFallback<T>(config);

const API: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Global Interceptor to handle common errors
API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // You can handle global 401s or 500s here
    return Promise.reject(error);
  }
);

export default API;
