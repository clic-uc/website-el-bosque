import React, { useState, useEffect } from "react";
import { Map, Layer } from "../../types/Map.tsx";

type MapItem = {
    id: number
    name: string
}

type SideBarProps = {
    maps: Map[]
    activeMaps: number[]
    onToggleMap: (id: number) => void
    activeLayers: Record<number, string[]>
    onToggleLayer: (mapId: number, layerId: string) => void
}

const SideBar: React.FC<SideBarProps> = ({ 
    maps,
    activeMaps,
    onToggleMap,
    activeLayers,
    onToggleLayer
}) => {
    const [expandedMaps, setExpandedMaps] = useState<Set<number>>(new Set());

    useEffect(() => {
        setExpandedMaps(new Set(maps.map(map => map.id)));
    }, [maps]);

    const toggleMapExpansion = (mapId: number) => {
        setExpandedMaps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mapId)) {
                newSet.delete(mapId);
            } else {
                newSet.add(mapId);
            }
            return newSet;
        });
    };

    return (
        <div className="w-[500px] min-w-[200px] h-screen bg-white shadow-md border-r p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex-shrink-0">
                <h2 className="text-lg font-bold mb-3">Mapas</h2>
                <div className="flex flex-col gap-2">
                    {maps.map((map) => (
                        <div key={map.id} className="flex flex-col">
                            <div 
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded select-none"
                                onClick={() => toggleMapExpansion(map.id)}
                            >
                                <span className="text-sm">
                                    {expandedMaps.has(map.id) ? '▼' : '▶'}
                                </span>
                                <span className="text-sm font-medium break-words">{map.name}</span>
                            </div>
                            {expandedMaps.has(map.id) && (
                                <div className="flex flex-col gap-1 pl-6 mt-1">
                                    {map.layers.map((layer) => (
                                        <label key={`${map.id}-${layer.id}`} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={activeLayers[map.id]?.includes(layer.id) || false}
                                                onChange={() => onToggleLayer(map.id, layer.id)}
                                                className="w-4 h-4 flex-shrink-0 mt-0.5"
                                            />
                                            <span className="text-sm break-words leading-tight">{layer.name}</span>
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
