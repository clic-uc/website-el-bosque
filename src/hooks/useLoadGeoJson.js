import { useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export const useLoadGeoJson = (geoJsonData, styleOptions = {}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    map.data.addGeoJson(geoJsonData);

    map.data.setStyle({
      strokeColor: styleOptions.strokeColor || 'red',
      strokeWeight: styleOptions.strokeWeight || 2,
      fillOpacity: styleOptions.fillOpacity ?? 0,
      ...styleOptions,
    });
  }, [map, mapsLib, geoJsonData, styleOptions]);
};