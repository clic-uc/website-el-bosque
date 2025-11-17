import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { SignOutButton, UserButton } from "@clerk/clerk-react";
import MapDisplay from "../components/map/MapDisplay.tsx";
import RecordsTable from "../components/table/RecordsTable.tsx";
import { AnyShape } from "../types/Shape.tsx";
import SideBar from "../components/map/SideBar.tsx";
import SearchBar from "../components/map/SearchBar.tsx";
import { useEffect, useMemo, useState } from "react";
import { useMaps } from "../hooks/useMaps";
import { useRecords } from "../hooks/useRecords";
import { transformBackendMapToFrontend } from "../utils/mapTransformers";
import type { GeographicalRecord } from "../types/api.types";
import AddMapModal from "../components/map/AddMapModal.tsx";
import EditMapModal from "../components/map/EditMapModal.tsx";
import CreateRecordModal from "../components/map/CreateRecordModal.tsx";
import type { Map } from "../types/Map.tsx";
import { getRoleLabel, isAdmin, isEditor, useCurrentRole } from "../auth/role";
import FilterSideBar from "../components/map/FilterSideBar.tsx";
import { LuFilter } from "react-icons/lu";

const MapPage = () => {
  // Activar clase para impedir scroll solo en la vista de mapa
  useEffect(() => {
    document.body.classList.add('map-view');
    const root = document.getElementById('root');
    root?.classList.add('map-view');
    return () => {
      document.body.classList.remove('map-view');
      root?.classList.remove('map-view');
    };
  }, []);
  // Fetch maps from backend
  const { data: backendMaps, isLoading: mapsLoading, error: mapsError } = useMaps();
  const role = useCurrentRole();
  const isAdminRole = isAdmin(role);
  const isEditorRole = isEditor(role);
  const canManageMaps = isAdminRole || isEditorRole;
  const roleLabel = getRoleLabel(role);
  const roleBadgeClass = isAdminRole
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : isEditorRole
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-slate-200 bg-slate-50 text-slate-600";

  const maps = useMemo(() => {
    if (!backendMaps) return [];
    return backendMaps.map(transformBackendMapToFrontend);
  }, [backendMaps]);

  // State: Mapas activos (inicialmente vacío - el usuario debe seleccionar)
  const [activeMaps, setActiveMaps] = useState<number[]>([]);
  
  // State: Polígonos activos (para mostrar capas GeoJSON)
  const [activePolygons, setActivePolygons] = useState<Set<string>>(new Set());
  
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

  // State: Modal de crear registro
  const [isCreateRecordModalOpen, setCreateRecordModalOpen] = useState(false);
  const [mapClickCallback, setMapClickCallback] = useState<((lat: number, lon: number) => void) | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  useEffect(() => {
    if (!canManageMaps) {
      setAddMapModalOpen(false);
      setEditMapModalOpen(false);
      setEditingMap(null);
    }
  }, [canManageMaps]);

  // Fetch records SOLO para los mapas activos con coordenadas válidas
  const firstActiveMapId = activeMaps[0];
  
  // TODO: Mejorar para fetchear records de TODOS los mapas activos, no solo el primero
  // Opciones: 1) Múltiples queries paralelas, 2) Backend soporta multiple mapIds
  // Para vista de mapa: solo records con coordenadas
  // Para vista de tabla: todos los records
  const { data: recordsData, isLoading: recordsLoading } = useRecords(
    firstActiveMapId 
      ? { mapId: firstActiveMapId, hasCoordinates: viewMode === 'map' ? true : undefined, filters: JSON.stringify(filters) }
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
          
          // Filtrar comments y links de ra.attributes porque son campos del record, no atributos del mapa
          const { comments: _, links: __, ...mapAttributes } = (ra.attributes || {}) as Record<string, any>;

          // Buscar el mapa para obtener icon e iconColor
          const map = maps.find(m => m.id === ra.mapId);

          shapesByMap[ra.mapId].push({
            id: `record-${record.id}`,
            type: "point",
            layerId: ra.mapId.toString(),
            coordinates: [record.lat, record.lon],
            icon: map?.icon,
            iconColor: map?.iconColor,
            attributes: {
              recordId: record.id,
              recordAttributeId: ra.id,
              "Rol SII": record.role?.roleId || "",
              ...mapAttributes,  // Atributos del mapa (sin comments ni links)
              comments: record.comments || "",  // Comments del record
              links: record.links || [],  // Links del record
              operations: record.role?.operations || [],  // Operaciones del rol
            },
          });
        });
      }
    });
    
    return shapesByMap;
  }, [recordsData, maps]);

  const handleToggleMap = (id: number) => {
    setActiveMaps((prev) =>
      prev.includes(id) ? prev.filter((mapId) => mapId !== id) : [...prev, id]
    );
  };

  const handleTogglePolygon = (polygonId: string) => {
    setActivePolygons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(polygonId)) {
        newSet.delete(polygonId);
      } else {
        newSet.add(polygonId);
      }
      return newSet;
    });
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

  // Handlers para CreateRecordModal
  const handleOpenCreateRecordModal = () => {
    setCreateRecordModalOpen(true);
  };

  const handleCloseCreateRecordModal = () => {
    setCreateRecordModalOpen(false);
    setMapClickCallback(null);
  };

  const handleMapClickForRecord = (callback: (lat: number, lon: number) => void) => {
    setMapClickCallback(() => callback);
  };

  const handleMapClickCancel = () => {
    setMapClickCallback(null);
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
    <div className="relative flex w-screen h-screen overflow-hidden">
        {canManageMaps && (
          <AddMapModal 
            isOpen={isAddMapModalOpen}
            onClose={handleCloseAddMapModal}
            maps={mapsForDisplay}
          />
        )}
        {canManageMaps && (
          <EditMapModal
            isOpen={isEditMapModalOpen}
            onClose={handleCloseEditMapModal}
            mapId={editingMap ? editingMap.id : null}
          />
        )}
        {canManageMaps && (
          <CreateRecordModal
            isOpen={isCreateRecordModalOpen}
            onClose={handleCloseCreateRecordModal}
            maps={mapsForDisplay}
            onMapClick={handleMapClickForRecord}
            onMapClickCancel={handleMapClickCancel}
          />
        )}
      
      <SideBar
        maps={mapsForDisplay}
        activeMaps={activeMaps}
        onToggleMap={handleToggleMap}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onAddMapClick={canManageMaps ? handleOpenAddMapModal : undefined}
        onEditMapClick={canManageMaps ? handleOpenEditMapModal : undefined}
        activePolygons={activePolygons}
        onTogglePolygon={handleTogglePolygon}
      />
      
      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* Barra de búsqueda y botones superiores */}
        <div className="z-[500] flex items-center justify-between gap-3 border-b bg-white p-3 shadow-sm">
            {/* Lado izquierdo: Búsqueda y Filtros */}
            <div className="flex items-center gap-3 flex-1">
              {/* Botón para expandir sidebar cuando está colapsado */}
              {isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                  title="Expandir barra lateral"
                >
                  <svg 
                    className="h-5 w-5"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </button>
              )}
              <SearchBar
                shapes={allShapes}
                onResultSelect={handleSearchResultSelect}
                mode={viewMode}
                onTableSearch={setTableSearchTerm}
                tableSearchTerm={tableSearchTerm}
              />
              <button
                onClick={() => setIsFilterOpen(prev => !prev)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 flex gap-2 items-center whitespace-nowrap"
              >
                <LuFilter />
                Filtros
              </button>
            </div>
            
            {/* Lado derecho: Botones de acciones y dropdown de usuario */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {canManageMaps && (
                <button
                  onClick={handleOpenCreateRecordModal}
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Registro
                </button>
              )}
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'table' : 'map')}
                className={`rounded-lg px-4 py-2 font-medium text-white transition-colors whitespace-nowrap ${
                  viewMode === 'table'
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {viewMode === 'map' ? 'Ver en tabla' : 'Ver en mapa'}
              </button>
              
              {/* Dropdown de usuario */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonPopoverCard: { display: 'none' },
                        userButtonTrigger: { '&:focus': { boxShadow: 'none' } }
                      }
                    }}
                  />
                  <svg 
                    className="w-4 h-4 text-gray-600 transition-transform group-hover:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[600]">
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${roleBadgeClass}`}>
                        {roleLabel}
                      </span>
                    </div>
                    {isAdminRole && (
                      <Link
                        to="/admin"
                        className="block w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 text-center"
                      >
                        Panel de administración
                      </Link>
                    )}
                    <button
                      onClick={() => window.open('https://accounts.clerk.com/user', '_blank')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 text-center"
                    >
                      Administrar cuenta
                    </button>
                    <SignOutButton>
                      <button className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Cerrar sesión
                      </button>
                    </SignOutButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Vista: Mapa o Tabla */}
          <div className="relative flex-1 overflow-hidden flex">
            {viewMode === 'map' ? (
              <MapDisplay
                maps={mapsForDisplay}
                activeMap={activeMap}
                activeMaps={activeMaps}
                activePolygons={activePolygons}
                className="h-full w-full"
                onCreateShape={handleCreateShape}
                onUpdateShape={handleUpdateShape}
                onDeleteShape={handleDeleteShape}
                selectedShapeFromSearch={selectedShapeFromSearch}
                onSearchShapeCleared={() => setSelectedShapeFromSearch(null)}
                canManageShapes={canManageMaps}
                canEditAttributes={canManageMaps}
                canImport={canManageMaps}
                mapClickCallback={mapClickCallback}
              />
            ) : (
              <RecordsTable
                records={Array.isArray(recordsData) 
                  ? recordsData 
                  : (recordsData as unknown as { data?: GeographicalRecord[] })?.data ?? []}
                isLoading={recordsLoading}
                mapId={firstActiveMapId}
                searchTerm={tableSearchTerm}
                hasRole={activeMap?.hasRole}
              />
            )}
            <FilterSideBar isOpen={isFilterOpen} mapId={firstActiveMapId} updateFilters={(newFilters) => setFilters(newFilters)} />
          </div>
        </div>
    </div>
  );
};

export default MapPage;
