import React from "react";
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
    return (
        <div className="w-[500px] min-w-[200px] h-screen bg-white shadow-md border-r p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex-shrink-0">
                <h2 className="text-lg font-bold mb-3">Mapas</h2>
                <div className="flex flex-col gap-2">
                    {maps.map((map) => (
                        <label key={map.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={activeMaps.includes(map.id)}
                                onChange={() => onToggleMap(map.id)}
                                className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="text-sm font-medium break-words">{map.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col gap-4 flex-1 min-h-0">
                {maps.filter(map => activeMaps.includes(map.id)).map(map => (
                    <div key={`layers-${map.id}`} className="flex-shrink-0">
                        <h3 className="text-sm font-semibold mb-2 text-blue-700 break-words">{map.name} - Capas</h3>
                        <div className="flex flex-col gap-1 pl-2">
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
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SideBar
