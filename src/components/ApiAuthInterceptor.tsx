import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { AxiosHeaders } from 'axios';
import { apiClient } from '../lib/api-client';
import { API_CONFIG } from '../config/api.config';

/**
 * Bridges Clerk authentication with the shared Axios client.
 * - Same-site APIs rely on the `__session` cookie (`withCredentials`).
 * - Cross-site APIs receive an `Authorization: Bearer <sessionToken>` header.
 */
const ApiAuthInterceptor = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let isActive = true;

    const shouldSendCookie = (() => {
      try {
        const apiUrl = new URL(API_CONFIG.baseURL, window.location.origin);
        return apiUrl.origin === window.location.origin;
      } catch {
        return false;
      }
    })();

    const interceptorId = apiClient.interceptors.request.use(
      async (config) => {
        const headers =
          config.headers instanceof AxiosHeaders
            ? config.headers
            : new AxiosHeaders(config.headers ?? {});
        config.headers = headers;

        if (shouldSendCookie && config.withCredentials !== false) {
          config.withCredentials = true;
        }

        const hasAuthHeader = headers.has('Authorization');

        if (!shouldSendCookie && isSignedIn && !hasAuthHeader) {
          try {
            const token = await getToken();
            if (token && isActive) {
              headers.set('Authorization', `Bearer ${token}`);
              config.headers = headers;
            }
          } catch (error) {
            console.error('[Clerk] Failed to retrieve session token', error);
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    return () => {
      isActive = false;
      apiClient.interceptors.request.eject(interceptorId);
    };
  }, [getToken, isSignedIn]);

  return null;
};

export default ApiAuthInterceptor;
