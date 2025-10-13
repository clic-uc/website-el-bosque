import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

/**
 * Axios instance configurado para el backend
 */
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

/**
 * Interceptor de request
 * Aquí puedes agregar headers de autenticación, logging, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response
 * Manejo centralizado de errores
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Manejo de errores comunes
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('[API Error 400] Bad Request:', data.message);
          break;
        case 401:
          console.error('[API Error 401] Unauthorized');
          // Redirigir a login si es necesario
          break;
        case 404:
          console.error('[API Error 404] Not Found:', data.message);
          break;
        case 500:
          console.error('[API Error 500] Internal Server Error:', data.message);
          break;
        default:
          console.error(`[API Error ${status}]`, data.message);
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error('[API Error] No response from server:', error.message);
    } else {
      // Algo pasó al configurar la petición
      console.error('[API Error] Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
