import {AnyShape} from "../../types/Shape.tsx";
import {Attribute} from "../../types/Map.tsx";
import {useEffect, useState} from "react";
import {useUpdateRecord} from "../../hooks/useRecords";

interface SidePanelProps {
    shape: AnyShape | null;
    mapAttributes: Attribute[];
    open: boolean;
    cancel: (() => void) | null;
    save: ((updatedAttributes: Record<string, string | number | boolean>) => void) | null;
    mapId?: number; // Necesario para identificar qué RecordAttribute actualizar
    readOnly?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({shape, mapAttributes, open, cancel, save, mapId, readOnly = false}) => {
    const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>(shape?.attributes || {});
    const updateRecordMutation = useUpdateRecord();
    const isReadOnly = readOnly || !save;

    useEffect(() => {
        setAttributes(shape?.attributes || {});
    }, [shape]);

    const handleSave = async () => {
        if (isReadOnly) return;
        if (!shape || !mapId) return;

        // Extraer el recordId de los atributos del shape
        const recordId = attributes.recordId as number;
        
        if (!recordId) {
            alert('Error: No se puede actualizar. Registro sin ID.');
            return;
        }

        // Separar atributos que son metadatos vs datos reales del record
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { recordId: _, recordAttributeId: __, "Rol SII": ___, ...recordAttributesData } = attributes;

        try {
            // Actualizar el Record con sus recordAttributes en el backend
            console.log('Patch record payload:', { 
                id: recordId, 
                mapId,
                recordAttributes: [{
                    mapId: mapId,
                    attributes: recordAttributesData
                }]
            });
            
            await updateRecordMutation.mutateAsync({
                id: recordId,
                dto: {
                    recordAttributes: [{
                        mapId: mapId,
                        attributes: recordAttributesData
                    }]
                }
            });

            // Llamar también a la función save local para actualizar el UI inmediatamente
            if (save) {
                save(attributes);
            }

            // Cerrar el panel después de guardar exitosamente
            if (cancel) {
                cancel();
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // Extraer mensaje más útil del error del servidor si está disponible
            console.error('Error actualizando registro:', error);
            const serverMessage = error?.response?.data?.message || error?.response?.data || error?.message;
            alert(`Error al actualizar el registro en el servidor: ${String(serverMessage)}`);
        }
    };

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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                            disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                    disabled={updateRecordMutation.isPending}
                >{isReadOnly ? 'Cerrar' : 'Cancelar'}</button>
                {
                    !isReadOnly && (
                        <button
                            className={"flex-auto bg-primary hover:bg-primary-light transition-colors text-white p-2 rounded-md cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"}
                            onClick={handleSave}
                            disabled={updateRecordMutation.isPending}
                        >
                            {updateRecordMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    )
                }
            </div>
        </div>
    )

}

export default SidePanel;
