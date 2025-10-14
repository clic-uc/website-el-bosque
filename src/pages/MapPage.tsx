import "leaflet/dist/leaflet.css";
import MapDisplay from "../components/map/MapDisplay.tsx";
import { AnyShape } from "../types/Shape.tsx";
import SideBar from "../components/map/SideBar.tsx";
import { useMemo, useState } from "react";
import { useMaps } from "../hooks/useMaps";
import { useRecords } from "../hooks/useRecords";
import { transformBackendMapToFrontend } from "../utils/mapTransformers";

const MapPage = () => {
  // Fetch maps from backend
  const { data: backendMaps, isLoading: mapsLoading, error: mapsError } = useMaps();

  const maps = useMemo(() => {
    if (!backendMaps) return [];
    return backendMaps.map(transformBackendMapToFrontend);
  }, [backendMaps]);

  // State: Mapas activos (inicialmente vacío - el usuario debe seleccionar)
  const [activeMaps, setActiveMaps] = useState<number[]>([]);
  
  // State: Shapes creados localmente por el usuario (no persistidos aún en backend)
  const [localShapes, setLocalShapes] = useState<Record<number, AnyShape[]>>({});

  // Fetch records SOLO para los mapas activos con coordenadas válidas
  const firstActiveMapId = activeMaps[0];
  
  // TODO: Mejorar para fetchear records de TODOS los mapas activos, no solo el primero
  // Opciones: 1) Múltiples queries paralelas, 2) Backend soporta multiple mapIds
  const { data: recordsData } = useRecords({ 
    mapId: firstActiveMapId,
    hasCoordinates: true,
    limit: 5000  // Límite aumentado para probar clustering con muchos datos
  });

  // Transform records to shapes
  // layerId ahora = mapId (corrigiendo el malentendido original)
  const shapesFromRecords = useMemo(() => {
    if (!recordsData?.data) return {};
    
    console.log('📊 Records recibidos del backend:', recordsData.data.length);
    console.log('📊 Primer record:', recordsData.data[0]);
    
    const shapesByMap: Record<number, AnyShape[]> = {};
    
    recordsData.data.forEach((record) => {
      // El backend ya filtró por hasCoordinates, pero doble check por seguridad
      if (!record.lat || !record.lon) return;
      
      // Cada record puede estar asociado a múltiples mapas via recordAttributes
      if (record.recordAttributes && record.recordAttributes.length > 0) {
        record.recordAttributes.forEach((ra, index) => {
          // Validación defensiva: asegurar que ra existe y tiene mapId
          if (!ra || !ra.mapId) {
            console.warn('⚠️ Record con recordAttribute inválido:', {
              recordId: record.id,
              attributeIndex: index,
              recordAttribute: ra,
              ra_exists: !!ra,
              ra_mapId: ra?.mapId,
              ra_keys: ra ? Object.keys(ra) : 'ra is null/undefined',
              totalAttributes: record.recordAttributes?.length
            });
            return;
          }
          
          if (!shapesByMap[ra.mapId]) {
            shapesByMap[ra.mapId] = [];
          }
          
          shapesByMap[ra.mapId].push({
            id: `record-${record.id}`,
            type: "point", // TODO: Soportar line y poly cuando existan en el backend
            layerId: ra.mapId.toString(), // ✅ layerId = mapId (corregido)
            coordinates: [record.lat, record.lon],
            attributes: {
              recordId: record.id,
              roleId: record.roleId || "",
              ...(ra.attributes || {}), // Atributos específicos para este mapa
            },
          });
        });
      }
    });
    
    return shapesByMap;
  }, [recordsData]);

  const handleToggleMap = (id: number) => {
    setActiveMaps((prev) =>
      prev.includes(id) ? prev.filter((mapId) => mapId !== id) : [...prev, id]
    );
  };

  const mapsWithShapes = useMemo(() => {
    return maps.map((map) => ({
      ...map,
      shapes: [
        ...(shapesFromRecords[map.id] || []),
        ...(localShapes[map.id] || []),
      ],
    }));
  }, [maps, shapesFromRecords, localShapes]);

  const mapsForDisplay = mapsWithShapes;

  const activeMapsData = mapsWithShapes.filter((map) =>
    activeMaps.includes(map.id)
  );

  const activeMap = activeMapsData[0] || mapsWithShapes[0];

  const handleCreateShape = (
    shape: AnyShape,
    success: (shape: AnyShape) => void,
    errorCallback: (error: string) => void
  ) => {
    if (!activeMap) {
      errorCallback("No active map");
      return;
    }
    setLocalShapes((prev) => ({
      ...prev,
      [activeMap.id]: [...(prev[activeMap.id] || []), shape],
    }));
    success(shape);
  };

  const handleUpdateShape = (
    shape: AnyShape,
    success: (shape: AnyShape) => void,
    errorCallback: (error: string) => void
  ) => {
    if (!activeMap) {
      errorCallback("No active map");
      return;
    }
    const shapes = localShapes[activeMap.id] || [];
    const index = shapes.findIndex((s) => s.id === shape.id);
    if (index === -1) {
      errorCallback("Shape not found");
      return;
    }
    setLocalShapes((prev) => {
      const newShapes = [...(prev[activeMap.id] || [])];
      newShapes[index] = shape;
      return {
        ...prev,
        [activeMap.id]: newShapes,
      };
    });
    success(shape);
  };

  const handleDeleteShape = (
    shapeId: string,
    success: () => void,
    errorCallback: (error: string) => void
  ) => {
    if (!activeMap) {
      errorCallback("No active map");
      return;
    }
    setLocalShapes((prev) => ({
      ...prev,
      [activeMap.id]: (prev[activeMap.id] || []).filter(
        (s) => s.id !== shapeId
      ),
    }));
    success();
  };

  // Loading states
  if (mapsLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando mapas...</p>
          <p className="text-sm text-gray-500 mt-2">Conectando con el backend...</p>
        </div>
      </div>
    );
  }

  if (mapsError) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500 font-semibold">Error al cargar mapas</p>
          <p className="text-sm text-gray-600 mt-2">{mapsError.message}</p>
        </div>
      </div>
    );
  }

  if (!maps || maps.length === 0) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-700">No hay mapas disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen">
      <SideBar
        maps={mapsForDisplay}
        activeMaps={activeMaps}
        onToggleMap={handleToggleMap}
      />
      <div className="flex-1">
        <MapDisplay
          maps={mapsForDisplay}
          activeMap={activeMap}
          activeMaps={activeMaps}
          className={"w-[100vw] h-[100vh]"}
          onCreateShape={handleCreateShape}
          onUpdateShape={handleUpdateShape}
          onDeleteShape={handleDeleteShape}
        />
      </div>
    </div>
  );
};

export default MapPage;
