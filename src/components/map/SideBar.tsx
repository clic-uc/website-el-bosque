import React, { useState, useMemo } from "react";
import { Map } from "../../types/Map.tsx";
import { groupMapsByDepartment, getDepartmentLabel } from "../../utils/mapTransformers";
import IconRenderer from "../common/IconRenderer";

type SideBarProps = {
    maps: Map[]
    activeMaps: number[]
    onToggleMap: (id: number) => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    onAddMapClick?: () => void
    onEditMapClick?: (map: Map) => void
    activePolygons?: Set<string>
    onTogglePolygon?: (polygonId: string) => void
}

const SideBar: React.FC<SideBarProps> = ({ 
    maps,
    activeMaps,
    onToggleMap,
    isCollapsed = false,
    onToggleCollapse,
    onAddMapClick,
    onEditMapClick,
    activePolygons: externalActivePolygons,
    onTogglePolygon,
}) => {
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
        new Set(["edificacion", "ejecucion", "emergencias", "vivienda"])
    );
    const [showPolygons, setShowPolygons] = useState<boolean>(true);
    
    // Usar estado externo si está disponible, si no usar estado interno
    const activePolygons = externalActivePolygons || new Set<string>();
    
    const handleTogglePolygon = (polygonId: string) => {
        if (onTogglePolygon) {
            onTogglePolygon(polygonId);
        } else {
            console.warn('⚠️ onTogglePolygon no está definido');
        }
    };

    // Agrupar mapas por departamento
    const groupedMaps = useMemo(() => {
        return groupMapsByDepartment(maps);
    }, [maps]);

    const toggleDepartmentExpansion = (dept: string) => {
        setExpandedDepartments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dept)) {
                newSet.delete(dept);
            } else {
                newSet.add(dept);
            }
            return newSet;
        });
    };

    return (
        <div className={`flex-shrink-0 h-full bg-white shadow-md border-r flex flex-col transition-all duration-300 z-[100] ${
            isCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
            {!isCollapsed && (
                <>
                    {/* Header fijo con botón de colapsar */}
                    <div className="flex-shrink-0 border-b bg-white shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2">
                            <h2 className="text-base font-bold text-gray-800">Departamentos y Mapas</h2>
                            <div className="flex items-center gap-2">
                                {onAddMapClick && (
                                    <button
                                        onClick={onAddMapClick}
                                        className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                                        title="Añadir mapa"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                        </svg>
                                    </button>
                                )}
                                {onToggleCollapse && (
                                    <button
                                        onClick={onToggleCollapse}
                                        className="flex-shrink-0 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                                        title="Colapsar barra lateral"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Contenido scrollable */}
                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                        <div className="flex flex-col gap-2">
                            {Object.keys(groupedMaps).map((department) => (
                                <div key={department} className="flex flex-col mb-2">
                                    {/* Departamento */}
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded select-none bg-blue-100"
                                        onClick={() => toggleDepartmentExpansion(department)}
                                    >
                                        <span className="text-sm font-bold">
                                            {expandedDepartments.has(department) ? '▼' : '▶'}
                                        </span>
                                        <span className="text-sm font-bold text-blue-900">
                                            {getDepartmentLabel(department)}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-auto">
                                            ({groupedMaps[department].length})
                                        </span>
                                    </div>

                                    {/* Mapas del departamento */}
                                    {expandedDepartments.has(department) && (
                                        <div className="flex flex-col gap-1 pl-4 mt-1">
                                            {groupedMaps[department].map((map) => (
                                                <label 
                                                    key={map.id} 
                                                    className="group flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="activeMap"
                                                        checked={activeMaps.includes(map.id)}
                                                        onChange={() => onToggleMap(map.id)}
                                                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                                                    />
                                                    <IconRenderer 
                                                        name={map.icon} 
                                                        color={map.iconColor}
                                                        size={18}
                                                        className="flex-shrink-0 mt-0.5"
                                                    />
                                                    <span className="text-sm font-medium break-words flex-1">
                                                        {map.name}
                                                    </span>
                                                    {onEditMapClick && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); onEditMapClick(map); }}
                                                            className="ml-auto p-1 rounded hover:bg-gray-100 text-gray-600 transition-all duration-150 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                                                            title="Más opciones"
                                                            aria-label={`Más opciones para ${map.name}`}
                                                        >
                                                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Sección de Polígonos */}
                        <div className="flex-shrink-0 border-t pt-4">
                        <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded select-none bg-purple-100 mb-2"
                            onClick={() => setShowPolygons(!showPolygons)}
                        >
                            <span className="text-sm font-bold">
                                {showPolygons ? '▼' : '▶'}
                            </span>
                            <span className="text-sm font-bold text-purple-900">
                                Polígonos
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                                (3)
                            </span>
                        </div>

                        {showPolygons && (
                            <div className="flex flex-col gap-1 pl-4">
                                {/* Polígono 1 - Comuna */}
                                <label className="group flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={activePolygons.has('comuna')}
                                        onChange={() => handleTogglePolygon('comuna')}
                                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-medium break-words">
                                        Comuna
                                    </span>
                                </label>

                                {/* Polígono 2 - Sectores */}
                                <label className="group flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={activePolygons.has('sectores')}
                                        onChange={() => handleTogglePolygon('sectores')}
                                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-medium break-words">
                                        Sectores
                                    </span>
                                </label>

                                {/* Polígono 3 - Villas/Poblaciones */}
                                <label className="group flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={activePolygons.has('villas-poblaciones')}
                                        onChange={() => handleTogglePolygon('villas-poblaciones')}
                                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-medium break-words">
                                        Villas/Poblaciones
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default SideBar
