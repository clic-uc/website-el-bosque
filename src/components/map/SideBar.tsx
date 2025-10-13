import React, { useState, useMemo } from "react";
import { Map } from "../../types/Map.tsx";
import { groupMapsByDepartment, getDepartmentLabel } from "../../utils/mapTransformers";

type SideBarProps = {
    maps: Map[]
    activeMaps: number[]
    onToggleMap: (id: number) => void
}

const SideBar: React.FC<SideBarProps> = ({ 
    maps,
    activeMaps,
    onToggleMap,
}) => {
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
        new Set(["edificacion", "ejecucion", "emergencias", "vivienda"])
    );

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
        <div className="w-[500px] min-w-[200px] h-screen bg-white shadow-md border-r p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex-shrink-0">
                <h2 className="text-lg font-bold mb-3">Departamentos y Mapas</h2>
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
                                            className="flex items-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
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
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SideBar
