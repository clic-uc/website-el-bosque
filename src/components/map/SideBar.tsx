import React from "react";

type Layer = {
    id: string
    name: string
}

type SideBarProps = {
    layers: Layer[]
    activeLayers: string[]
    onToggleLayer: (id: string) => void
}

const SideBar: React.FC<SideBarProps> = ({ layers, activeLayers, onToggleLayer }) => {
    return (
        <aside className="w-64 h-screen bg-white shadow-md border-r p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Capas</h2>
            <div className="flex flex-col gap-2">
                {layers.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input
                            type="checkbox"
                            checked={activeLayers.includes(layer.id)}
                            onChange={() => onToggleLayer(layer.id)}
                            className="w-4 h-4"
                        />
                        <span>{layer.name}</span>
                    </label>
                ))}
            </div>
        </aside>
    )
}

export default SideBar