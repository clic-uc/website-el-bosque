import {AnyShape} from "../../types/Shape.tsx";
import {Attribute} from "../../types/Map.tsx";
import {useEffect, useState} from "react";

interface SidePanelProps {
    shape: AnyShape | null;
    mapAttributes: Attribute[];
    open: boolean;
    cancel: (() => void) | null;
    save: ((updatedAttributes: Record<string, string | number | boolean>) => void) | null;
}

const SidePanel: React.FC<SidePanelProps> = ({shape, mapAttributes, open, cancel, save}) => {

    const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>(shape?.attributes || {});

    useEffect(() => {
        setAttributes(shape?.attributes || {});
    }, [shape]);

    return (
        <div
            className={"flex flex-col min-h overflow-hidden absolute z-[1000] top-0 right-0 h-full w-[20rem] bg-white shadow-lg shadow-black p-4 transform transition-transform " + (open ? "translate-x-0" : "translate-x-full")}
        >
            {/* Header */}
            {shape && (
                <div className="flex-none mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Datos del Registro</h3>
                </div>
            )}

            {/* Scrollable attributes section */}
            <div className={"flex-1 flex flex-col gap-4 overflow-auto mb-4"}>
                {
                    mapAttributes.map((attribute) => {
                        const value = attributes[attribute.id];
                        const hasValue = value !== undefined && value !== null && value !== "";
                        
                        return (
                            attribute.type === "string" ? (
                                <div key={attribute.id} className={"flex flex-col gap-1"}>
                                    <p className={"text-sm font-semibold"}>{attribute.name}</p>
                                    {hasValue && (
                                        <p className="text-xs text-gray-500 italic">
                                            Actual: {value as string}
                                        </p>
                                    )}
                                    <input
                                        type="text"
                                        value={value as string || ""}
                                        onChange={(e) => setAttributes(prev => ({...prev, [attribute.id]: e.target.value}))}
                                        className={"p-1 border border-gray-300 rounded-md"}
                                        placeholder={!hasValue ? "Sin valor" : ""}
                                    />
                                </div>
                            ) : attribute.type === "number" ? (
                                <div key={attribute.id} className={"flex flex-col gap-1"}>
                                    <p className={"text-sm font-semibold"}>{attribute.name}</p>
                                    {hasValue && (
                                        <p className="text-xs text-gray-500 italic">
                                            Actual: {value as number}
                                        </p>
                                    )}
                                    <input
                                        type="number"
                                        value={value as number || ""}
                                        onChange={(e) => setAttributes(prev => ({...prev, [attribute.id]: parseFloat(e.target.value)}))}
                                        className={"p-1 border border-gray-300 rounded-md"}
                                        placeholder={!hasValue ? "Sin valor" : ""}
                                    />
                                </div>
                            ) : attribute.type === "boolean" ? (
                                <div key={attribute.id} className={"flex flex-col gap-1"}>
                                    <div className="flex flex-row gap-2 justify-between items-center">
                                        <p className={"text-sm font-semibold"}>{attribute.name}</p>
                                        <input
                                            type="checkbox"
                                            checked={value as boolean || false}
                                            onChange={(e) => setAttributes(prev => ({...prev, [attribute.id]: e.target.checked}))}
                                            className={"h-4 w-4"}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 italic">
                                        Actual: {value ? "Sí" : "No"}
                                    </p>
                                </div>
                            ) : attribute.type === "date" ? (
                                <div key={attribute.id} className={"flex flex-col gap-1"}>
                                    <p className={"text-sm font-semibold"}>{attribute.name}</p>
                                    {hasValue && (
                                        <p className="text-xs text-gray-500 italic">
                                            Actual: {value as string}
                                        </p>
                                    )}
                                    <input
                                        type="date"
                                        value={value as string || ""}
                                        onChange={(e) => setAttributes(prev => ({...prev, [attribute.id]: e.target.value}))}
                                        className={"p-1 border border-gray-300 rounded-md"}
                                    />
                                </div>
                            ) : null
                        )
                    })
                }
            </div>

            {/* Action buttons */}
            <div className={"flex-none flex flex-row gap-2"}>
                <button
                    className={"flex-auto bg-gray-200 hover:bg-gray-300 transition-colors p-2 rounded-md cursor-pointer font-medium"}
                    onClick={cancel || undefined}
                >Cancelar</button>
                <button
                    className={"flex-auto bg-primary hover:bg-primary-light transition-colors text-white p-2 rounded-md cursor-pointer font-medium"}
                    onClick={() => {if (save) save({...attributes})}}
                >Guardar</button>
            </div>
        </div>
    )

}

export default SidePanel;