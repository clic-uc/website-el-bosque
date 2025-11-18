import {AnyShape} from "../../types/Shape.tsx";
import {Attribute} from "../../types/Map.tsx";
import {useEffect, useMemo, useState} from "react";
import {useUpdateRecord, useRolePresenceMaps} from "../../hooks/useRecords";

interface SidePanelProps {
    shape: AnyShape | null;
    mapAttributes: Attribute[];
    open: boolean;
    cancel: (() => void) | null;
    save: ((updatedAttributes: Record<string, string | number | boolean | Array<{ title: string; url: string }> | Array<{ operation: string; comment: string }>>) => void) | null;
    mapId?: number; // Necesario para identificar qué RecordAttribute actualizar
    hasRole?: boolean; // Si el mapa incluye información de rol
    readOnly?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({shape, mapAttributes, open, cancel, save, mapId, hasRole = false, readOnly = false}) => {
    const [attributes, setAttributes] = useState<Record<string, string | number | boolean | Array<{ title: string; url: string }> | Array<{ operation: string; comment: string }>>>(shape?.attributes || {});
    const [comments, setComments] = useState<string>("");
    const [links, setLinks] = useState<Array<{ title: string; url: string }>>([]);
    const updateRecordMutation = useUpdateRecord();
    const isReadOnly = readOnly || !save;

    // Validar formato Rol SII (XXXXX-XXXXX)
    const isValidRolFormat = (rol: string): boolean => {
        if (!rol) return true; // Vacío es válido
        const regex = /^\d{5}-\d{5}$/;
        return regex.test(rol);
    };

    const rolSiiValue = (attributes["Rol SII"] as string) || "";
    const rolSiiIsInvalid = rolSiiValue && !isValidRolFormat(rolSiiValue);

    // Presencia en otros mapas para este rol
    const { data: rolePresence = [], isLoading: presenceLoading } = useRolePresenceMaps(
        hasRole && isValidRolFormat(rolSiiValue) ? rolSiiValue : undefined
    );
    const otherMapsForRole = useMemo(() => {
        if (!mapId) return rolePresence;
        return rolePresence.filter(m => m.id !== mapId);
    }, [rolePresence, mapId]);

    useEffect(() => {
        setAttributes(shape?.attributes || {});
        // Cargar comments y links desde los atributos del shape
        const shapeComments = shape?.attributes?.comments;
        const shapeLinks = shape?.attributes?.links;
        const shapeOperations = shape?.attributes?.operations;
        
        // Debug: ver si las operaciones están llegando
        if (hasRole && shapeOperations) {
            console.log('Operaciones detectadas:', shapeOperations);
        }
        
        setComments(typeof shapeComments === 'string' ? shapeComments : "");
        // Solo cargar links si es un array con la estructura correcta (title, url)
        const validLinks = Array.isArray(shapeLinks) && shapeLinks.length > 0 && 'title' in shapeLinks[0];
        setLinks(validLinks ? shapeLinks as Array<{ title: string; url: string }> : []);
    }, [shape, hasRole]);

    const handleSave = async () => {
        if (isReadOnly) return;
        if (!shape || !mapId) return;

        // Extraer el recordId de los atributos del shape
        const recordId = attributes.recordId as number;
        
        if (!recordId) {
            alert('No se puede actualizar. Registro no encontrado.');
            return;
        }

        // Separar atributos que son metadatos vs datos reales del record
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { recordId: _, recordAttributeId: __, "Rol SII": ___, ...recordAttributesData } = attributes;

        try {
            // Actualizar el Record con sus recordAttributes, comments y links en el backend
            console.log('Patch record payload:', { 
                id: recordId, 
                mapId,
                comments,
                links,
                recordAttributes: [{
                    mapId: mapId,
                    attributes: recordAttributesData
                }]
            });
            
            await updateRecordMutation.mutateAsync({
                id: recordId,
                dto: {
                    comments,
                    links: links.length > 0 ? links : undefined,
                    recordAttributes: [{
                        mapId: mapId,
                        attributes: recordAttributesData
                    }]
                }
            });

            // React Query recargará automáticamente los registros después de la mutación
            // No necesitamos actualizar el shape localmente, ya que se recargará del servidor
            
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
                {/* Sección de Rol SII - Solo si el mapa tiene hasRole */}
                {shape && hasRole && (
                    <div className="flex-none bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Rol SII</p>
                        <input
                            type="text"
                            value={(attributes["Rol SII"] as string) || ""}
                            onChange={(e) => setAttributes(prev => ({...prev, "Rol SII": e.target.value}))}
                            className={`w-full p-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
                                rolSiiIsInvalid 
                                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                    : 'border-blue-300 focus:ring-blue-500'
                            }`}
                            placeholder="00000-00000"
                            disabled={isReadOnly}
                        />
                        {rolSiiIsInvalid && (
                            <p className="text-xs text-red-600 mt-1 italic">
                                Formato inválido: debe ser XXXXX-XXXXX
                            </p>
                        )}
                    </div>
                )}

                {/* Atributos del mapa */}
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

                {/* Secciones adicionales */}
                {shape && (
                    <>
                        {/* Comentarios */}
                        <div className="flex-none bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-2">Comentarios</p>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Agregar comentarios sobre este registro..."
                                className="w-full p-2 border border-purple-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={3}
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Enlaces externos */}
                        <div className="flex-none bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <p className="text-sm font-semibold text-indigo-900 mb-2">Enlaces Externos</p>
                            <div className="space-y-2">
                                {links.map((link, index) => (
                                    <div key={index} className="flex flex-col gap-1 bg-white p-2 rounded border border-indigo-200">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                value={link.title}
                                                onChange={(e) => {
                                                    const newLinks = [...links];
                                                    newLinks[index].title = e.target.value;
                                                    setLinks(newLinks);
                                                }}
                                                placeholder="Título del enlace"
                                                className="flex-1 p-1 border border-indigo-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                disabled={isReadOnly}
                                            />
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                                                    className="ml-2 text-red-500 hover:text-red-700"
                                                    title="Eliminar enlace"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => {
                                                const newLinks = [...links];
                                                newLinks[index].url = e.target.value;
                                                setLinks(newLinks);
                                            }}
                                            placeholder="https://ejemplo.com"
                                            className="p-1 border border-indigo-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            disabled={isReadOnly}
                                        />
                                        {link.url && (
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                                            >
                                                Abrir enlace →
                                            </a>
                                        )}
                                    </div>
                                ))}
                                {!isReadOnly && (
                                    <button
                                        onClick={() => setLinks([...links, { title: '', url: '' }])}
                                        className="w-full p-2 border-2 border-dashed border-indigo-300 rounded text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    >
                                        + Agregar enlace
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
                
                {/* Secciones específicas de rol - Solo si el mapa tiene hasRole */}
                {shape && hasRole && rolSiiValue && (
                    <>
                        {/* Operaciones sobre el rol */}
                        <div className="flex-none bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <p className="text-sm font-semibold text-amber-900 mb-2">Operaciones sobre el rol</p>
                            {attributes.operations && Array.isArray(attributes.operations) && attributes.operations.length > 0 ? (
                                <div className="space-y-2">
                                    {(attributes.operations as Array<{ operation: string; comment: string }>).map((op, index) => (
                                        <div key={index} className="bg-white p-2 rounded border border-amber-200">
                                            <p className="text-xs font-semibold text-amber-800">{op.operation}</p>
                                            <p className="text-xs text-gray-600 mt-1">{op.comment || 'Sin comentario'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-amber-700">Sin operaciones registradas</p>
                            )}
                        </div>

                        {/* Otros mapas con este rol */}
                        <div className="flex-none bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-sm font-semibold text-green-900 mb-2">Presente en otros mapas</p>
                            {presenceLoading ? (
                                <div className="text-xs text-green-700">Cargando...</div>
                            ) : otherMapsForRole.length > 0 ? (
                                <div className="space-y-1">
                                    {otherMapsForRole.map(m => (
                                        <div key={m.id} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                            {m.name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-green-700">No aparece en otros mapas</p>
                            )}
                        </div>
                    </>
                )}
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
