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
  
  // Fetch records from backend (limited to 100 per page by backend)
  // TODO: Implementar carga por mapa activo o paginación incremental
  const { data: recordsData, isLoading: recordsLoading, error: recordsError } = useRecords({ 
    page: 1, 
    limit: 100
  });

  const maps = useMemo(() => {
    if (!backendMaps) return [];
    return backendMaps.map(transformBackendMapToFrontend);
  }, [backendMaps]);

  const [activeMaps, setActiveMaps] = useState<number[]>([]);
  const [localShapes, setLocalShapes] = useState<Record<number, AnyShape[]>>({});

  const isLoading = mapsLoading || recordsLoading;
  const error = mapsError || recordsError;

  useMemo(() => {
    if (maps.length > 0 && activeMaps.length === 0) {
      setActiveMaps(maps.map((m) => m.id));
    }
  }, [maps, activeMaps.length]);

  // Transform records to shapes, associating each record with its correct maps
  const shapesFromRecords = useMemo(() => {
    if (!recordsData?.data) return {};
    
    const shapesByMap: Record<number, AnyShape[]> = {};
    
    recordsData.data.forEach((record) => {
      // Solo procesar records con coordenadas
      if (!record.lat || !record.lon) return;
      
      // Si el record tiene recordAttributes, asociarlo con los mapas específicos
      if (record.recordAttributes && record.recordAttributes.length > 0) {
        record.recordAttributes.forEach((ra) => {
          if (!shapesByMap[ra.mapId]) {
            shapesByMap[ra.mapId] = [];
          }
          
          shapesByMap[ra.mapId].push({
            id: `record-${record.id}-map-${ra.mapId}`,
            type: "point",
            layerId: "records", // layerId ya no es usado para filtrado, solo como identificador
            coordinates: [record.lat, record.lon],
            attributes: {
              recordId: record.id,
              roleId: record.roleId || "",
              // Atributos específicos de este record en este mapa
              ...ra.attributes,
            },
          });
        });
      }
      // Si no tiene recordAttributes, no lo mostramos en ningún mapa
      // (esto evita la duplicación masiva anterior)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando mapas...</p>
          <p className="text-sm text-gray-500 mt-2">Conectando con el backend...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500 font-semibold">Error al cargar mapas</p>
          <p className="text-sm text-gray-600 mt-2">{error.message}</p>
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
