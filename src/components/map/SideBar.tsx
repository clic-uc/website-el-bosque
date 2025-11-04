import React, { useState, useMemo } from "react";
import { Map } from "../../types/Map.tsx";
import { groupMapsByDepartment, getDepartmentLabel } from "../../utils/mapTransformers";

type SideBarProps = {
    maps: Map[]
    activeMaps: number[]
    onToggleMap: (id: number) => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    onAddMapClick?: () => void
    onEditMapClick?: (map: Map) => void
}

const SideBar: React.FC<SideBarProps> = ({ 
    maps,
    activeMaps,
    onToggleMap,
    isCollapsed = false,
    onToggleCollapse,
    onAddMapClick,
    onEditMapClick,
}) => {
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
        new Set(["edificacion", "ejecucion", "emergencias", "vivienda"])
    );
    const [showPolygons, setShowPolygons] = useState<boolean>(true);
    const [activePolygons, setActivePolygons] = useState<Set<string>>(new Set());

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
        <div className={`flex-shrink-0 h-full bg-white shadow-md border-r flex flex-col transition-all duration-300 ${
            isCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
            {!isCollapsed && (
                <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold">Departamentos y Mapas</h2>
                            <div className="flex items-center">
                                <button
                                    onClick={onAddMapClick}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Añadir mapa"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                    </svg>
                                </button>
                                {onToggleCollapse && (
                                    <button
                                        onClick={onToggleCollapse}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        title="Colapsar barra lateral"
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
                                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7" 
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
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
                                                        type="checkbox"
                                                        checked={activeMaps.includes(map.id)}
                                                        onChange={() => onToggleMap(map.id)}
                                                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                                                    />
                                                    <span className="text-sm font-medium break-words">
                                                        {map.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); onEditMapClick?.(map); }}
                                                        className="ml-auto p-1 rounded hover:bg-gray-100 text-gray-600 transition-all duration-150 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                                                        title="Más opciones"
                                                        aria-label={`Más opciones para ${map.name}`}
                                                    >
                                                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                                                        </svg>
                                                    </button>
                                                    
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
                                        onChange={() => {
                                            const newSet = new Set(activePolygons);
                                            if (newSet.has('comuna')) {
                                                newSet.delete('comuna');
                                            } else {
                                                newSet.add('comuna');
                                            }
                                            setActivePolygons(newSet);
                                            console.log('🗺️ Toggle polígono (mockup):', 'comuna');
                                        }}
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
                                        onChange={() => {
                                            const newSet = new Set(activePolygons);
                                            if (newSet.has('sectores')) {
                                                newSet.delete('sectores');
                                            } else {
                                                newSet.add('sectores');
                                            }
                                            setActivePolygons(newSet);
                                            console.log('🗺️ Toggle polígono (mockup):', 'sectores');
                                        }}
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
                                        onChange={() => {
                                            const newSet = new Set(activePolygons);
                                            if (newSet.has('villas-poblaciones')) {
                                                newSet.delete('villas-poblaciones');
                                            } else {
                                                newSet.add('villas-poblaciones');
                                            }
                                            setActivePolygons(newSet);
                                            console.log('🗺️ Toggle polígono (mockup):', 'villas-poblaciones');
                                        }}
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
            )}
        </div>
    )
}

export default SideBar
