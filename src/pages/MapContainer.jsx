import { Map } from '@vis.gl/react-google-maps';
import { useLoadGeoJson } from '../hooks/useLoadGeoJson';
import { elBosqueBorder } from '../data/elBosqueBorder.geojson';

const MapContainer = () => {
  useLoadGeoJson(elBosqueBorder, {
    strokeColor: 'red',
    strokeWeight: 2,
    fillOpacity: 0,
  });

  return (
    <Map
      defaultCenter={{ lat: -33.5607, lng: -70.6766 }}
      defaultZoom={14}
      gestureHandling="greedy"
      disableDefaultUI={false}
    />
  );
};

export default MapContainer;