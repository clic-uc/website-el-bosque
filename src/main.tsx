import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import './index.css';
import 'leaflet/dist/leaflet.css';
// react-leaflet-cluster ships the MarkerCluster CSS under dist/assets
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
