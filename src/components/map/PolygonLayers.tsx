import { GeoJSON } from 'react-leaflet';
import { Comuna } from '../../data/poligono_comuna.geojson.js';
import { Sectores } from '../../data/poligonos_sectores.geojson.js';
import { Villas_Poblaciones } from '../../data/poligonos_villas_poblaciones.geojson.js';
import type { PathOptions } from 'leaflet';

type PolygonLayersProps = {
  activePolygons: Set<string>;
};

const POLYGON_STYLES: Record<string, PathOptions> = {
  comuna: {
    color: '#8B5CF6', // purple-500
    weight: 3,
    opacity: 0.8,
    fillColor: '#8B5CF6',
    fillOpacity: 0.1,
  },
  sectores: {
    color: '#3B82F6', // blue-500
    weight: 2,
    opacity: 0.7,
    fillColor: '#3B82F6',
    fillOpacity: 0.08,
  },
  'villas-poblaciones': {
    color: '#10B981', // green-500
    weight: 2,
    opacity: 0.7,
    fillColor: '#10B981',
    fillOpacity: 0.08,
  },
};

// Función para transformar el formato personalizado a GeoJSON estándar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformToGeoJSON = (data: any): any => {
  // Si ya es un GeoJSON válido (como Comuna), devolverlo tal cual
  if (data.features && data.features[0]?.geometry) {
    return data;
  }

  // Si tiene el formato personalizado (como Sectores y Villas_Poblaciones)
  // Transformar a GeoJSON estándar
  return {
    type: 'FeatureCollection',
    features: data.features.map((feature: any) => ({
      type: 'Feature',
      properties: {
        id: feature.id,
        layerId: feature.layerId,
      },
      geometry: {
        type: 'Polygon',
        // Invertir coordenadas de [lat, lon] a [lon, lat]
        coordinates: feature.coordinates.map((ring: number[][]) =>
          ring.map((coord: number[]) => [coord[1], coord[0]])
        ),
      },
    })),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POLYGON_DATA: Record<string, any> = {
  comuna: transformToGeoJSON(Comuna),
  sectores: transformToGeoJSON(Sectores),
  'villas-poblaciones': transformToGeoJSON(Villas_Poblaciones),
};

const PolygonLayers: React.FC<PolygonLayersProps> = ({ activePolygons }) => {
  return (
    <>
      {Array.from(activePolygons).map((polygonId) => {
        const geoJsonData = POLYGON_DATA[polygonId];
        const style = POLYGON_STYLES[polygonId];

        if (!geoJsonData || !style) {
          console.warn(`⚠️ No se encontró data o estilo para polígono: ${polygonId}`);
          return null;
        }

        return (
          <GeoJSON
            key={polygonId}
            data={geoJsonData}
            style={style}
          />
        );
      })}
    </>
  );
};

export default PolygonLayers;
