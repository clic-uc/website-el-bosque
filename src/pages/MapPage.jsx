import { APIProvider } from '@vis.gl/react-google-maps';
import MapContainer from './MapContainer';

const MapPage = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ width: '100%', height: '100vh' }}>
        <MapContainer />
      </div>
    </APIProvider>
  );
};

export default MapPage;