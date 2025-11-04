import "leaflet/dist/leaflet.css";
import MapDisplay from "../components/map/MapDisplay.tsx";
import RecordsTable from "../components/table/RecordsTable.tsx";
import { AnyShape } from "../types/Shape.tsx";
import SideBar from "../components/map/SideBar.tsx";
import SearchBar from "../components/map/SearchBar.tsx";
import FeaturesAnnouncementModal from "../components/common/FeaturesAnnouncementModal.tsx";
import { useMemo, useState } from "react";
import { useMaps } from "../hooks/useMaps";
import { useRecords } from "../hooks/useRecords";
import { transformBackendMapToFrontend } from "../utils/mapTransformers";
import type { GeographicalRecord } from "../types/api.types";
import AddMapModal from "../components/map/AddMapModal.tsx";
import EditMapModal from "../components/map/EditMapModal.tsx";
import type { Map } from "../types/Map.tsx";

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

  // State: Shape seleccionado desde búsqueda (para centrar mapa)
  const [selectedShapeFromSearch, setSelectedShapeFromSearch] = useState<AnyShape | null>(null);

  // State: Modal de features visible al entrar
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(true);

  // State: Vista actual (mapa o tabla)
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // State: Sidebar colapsado
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State: Modal de añadir mapa
  const [isAddMapModalOpen, setAddMapModalOpen] = useState(false);

  // State: Modal de editar mapa
  const [isEditMapModalOpen, setEditMapModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<Map | null>(null);

  // Fetch records SOLO para los mapas activos con coordenadas válidas
  const firstActiveMapId = activeMaps[0];
  
  // TODO: Mejorar para fetchear records de TODOS los mapas activos, no solo el primero
  // Opciones: 1) Múltiples queries paralelas, 2) Backend soporta multiple mapIds
  // Para vista de mapa: solo records con coordenadas
  // Para vista de tabla: todos los records
  const { data: recordsData, isLoading: recordsLoading } = useRecords(
    firstActiveMapId 
      ? { mapId: firstActiveMapId, hasCoordinates: viewMode === 'map' ? true : undefined } 
      : undefined
  );

  // Transform records to shapes
  const shapesFromRecords = useMemo(() => {
    // Normalizar recordsData: puede ser array directo o objeto paginado { data, meta }
    const recordsList = Array.isArray(recordsData)
      ? recordsData
      : (recordsData as unknown as { data?: GeographicalRecord[] })?.data ?? [];

    if (!recordsList || recordsList.length === 0) return {};
    
    const shapesByMap: Record<number, AnyShape[]> = {};
    
    recordsList.forEach((record: GeographicalRecord) => {
      // El backend ya filtró por hasCoordinates, pero doble check por seguridad
      if (!record.lat || !record.lon) return;

      if (record.recordAttributes && record.recordAttributes.length > 0) {
        record.recordAttributes.forEach((ra, index: number) => {
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
            type: "point",
            layerId: ra.mapId.toString(),
            coordinates: [record.lat, record.lon],
            attributes: {
              recordId: record.id,
              recordAttributeId: ra.id,
              "Rol SII": record.role?.roleId || "",
              ...(ra.attributes || {}),
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

  // Obtener todos los shapes disponibles para búsqueda
  const allShapes = useMemo(() => {
    return mapsWithShapes.flatMap(map => map.shapes);
  }, [mapsWithShapes]);

  const handleSearchResultSelect = (shape: AnyShape) => {
    // Encontrar a qué mapa pertenece el shape
    const mapId = parseInt(shape.layerId);
    
    // Activar el mapa si no está activo
    if (!activeMaps.includes(mapId)) {
      setActiveMaps(prev => [...prev, mapId]);
    }
    
    // Marcar el shape para que MapDisplay haga zoom
    setSelectedShapeFromSearch(shape);
  };

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
  // State y handlers para AddMapModal
  const handleOpenAddMapModal = () => {
      setAddMapModalOpen(true); // 2. Función para abrir
  };

  const handleCloseAddMapModal = () => {
      setAddMapModalOpen(false); // 2. Función para cerrar
  };

  // Handlers para EditMapModal
  const handleOpenEditMapModal = (map: Map) => {
    setEditingMap(map);
    setEditMapModalOpen(true);
  };

  const handleCloseEditMapModal = () => {
    setEditingMap(null);
    setEditMapModalOpen(false);
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
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Modal de anuncios de features */}
      <FeaturesAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
      <AddMapModal 
        isOpen={isAddMapModalOpen}
        onClose={handleCloseAddMapModal}
        maps={mapsForDisplay}
      />
      <EditMapModal
        isOpen={isEditMapModalOpen}
        onClose={handleCloseEditMapModal}
        mapId={editingMap ? editingMap.id : null}
      />
      
      <SideBar
        maps={mapsForDisplay}
        activeMaps={activeMaps}
        onToggleMap={handleToggleMap}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onAddMapClick={handleOpenAddMapModal}
        onEditMapClick={handleOpenEditMapModal}
      />
      
      {/* Botón para expandir sidebar cuando está colapsado */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg border border-gray-200 rounded-r-lg p-2 hover:bg-gray-50 transition-colors"
          title="Expandir barra lateral"
        >
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 5l7 7-7 7M5 5l7 7-7 7" 
            />
          </svg>
        </button>
      )}
      
      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        {/* Barra de búsqueda y botones superiores */}
        <div className="flex-shrink-0 bg-white border-b shadow-sm p-3 z-[1500] flex items-center gap-3">
          <SearchBar
            shapes={allShapes}
            onResultSelect={handleSearchResultSelect}
          />
          
          {/* Botones de acciones */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => alert('Funcionalidad de Subdividir en desarrollo')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Subdividir
            </button>
            <button
              onClick={() => alert('Funcionalidad de Fusionar en desarrollo')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Fusionar
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'table' : 'map')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {viewMode === 'map' ? 'Ver en tabla' : 'Ver en mapa'}
            </button>
          </div>
        </div>
        
        {/* Vista: Mapa o Tabla */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'map' ? (
            <MapDisplay
              maps={mapsForDisplay}
              activeMap={activeMap}
              activeMaps={activeMaps}
              className="w-full h-full"
              onCreateShape={handleCreateShape}
              onUpdateShape={handleUpdateShape}
              onDeleteShape={handleDeleteShape}
              selectedShapeFromSearch={selectedShapeFromSearch}
              onSearchShapeCleared={() => setSelectedShapeFromSearch(null)}
            />
          ) : (
            <RecordsTable
              records={Array.isArray(recordsData) 
                ? recordsData 
                : (recordsData as unknown as { data?: GeographicalRecord[] })?.data ?? []}
              isLoading={recordsLoading}
              mapId={firstActiveMapId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
