import {AnyShape} from "../../types/Shape.tsx";
import {useEffect, useState} from "react";
import {IoMdAdd, IoMdClose} from "react-icons/io";

interface ShapeInputProps {
    type: "point" | "line" | "poly";
    onCreate: (shape: AnyShape) => void;
    inputGroupRef: React.RefObject<L.FeatureGroup | null>;
}

const ShapeInput: React.FC<ShapeInputProps> = (props) => {
    const [open, setOpen] = useState<boolean>(false);
    const [selectedIcon, setSelectedIcon] = useState<string>('default');
    const [customIconUrl, setCustomIconUrl] = useState<string>('');

    useEffect(() => {
        return () => {
            if (props.inputGroupRef.current) {
                props.inputGroupRef.current.clearLayers();
            }
        }
    })

    return (
        open ? <div
            className={"absolute bottom-6 right-2 z-[900] p-2 flex flex-col gap-2 bg-white rounded-md shadow-sm shadow-black"}
        >
            {
                props.type === "point" ? (
                    <>
                        <div className={"flex flex-row items-center justify-between"}>
                            <p className={"text-sm font-semibold"}>Agregar Punto</p>
                            <div
                                className={"hover:bg-gray-200 p-1 rounded-full cursor-pointer transition-colors"}
                                onClick={() => setOpen(false)}
                            >
                                <IoMdClose />
                            </div>
                        </div>
                        <div className={"flex flex-col gap-2"}>
                            <input
                                type="text"
                                placeholder="Coordenadas (lat, lon)"
                                className={"p-1 border border-gray-300 rounded-md w-[20rem]"}
                            />
                            
                            {/* Selector de icono - NUEVO */}
                            <div className="border-t pt-2">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Icono del punto</p>
                                <select
                                    value={selectedIcon}
                                    onChange={(e) => setSelectedIcon(e.target.value)}
                                    className="w-full p-1 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="default">📍 Marcador por defecto</option>
                                    <option value="house">🏠 Casa</option>
                                    <option value="building">🏢 Edificio</option>
                                    <option value="tree">🌳 Árbol</option>
                                    <option value="park">🏞️ Parque</option>
                                    <option value="custom">🖼️ Imagen personalizada</option>
                                </select>
                            </div>

                            {/* Subir imagen personalizada - NUEVO */}
                            {selectedIcon === 'custom' && (
                                <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Subir imagen</p>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/svg+xml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                setCustomIconUrl(url);
                                                console.log('Imagen cargada (mockup):', url);
                                            }
                                        }}
                                        className="text-xs w-full"
                                    />
                                    {customIconUrl && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <img 
                                                src={customIconUrl} 
                                                alt="Preview" 
                                                className="w-8 h-8 object-contain border rounded"
                                            />
                                            <span className="text-xs text-green-600">✓ Imagen cargada</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : props.type === "line" ? (
                    <></>
                ) : (
                    <></>
                )
            }
            <button
                className={"flex-auto bg-primary hover:bg-primary-light transition-colors text-white p-1 rounded-md cursor-pointer"}
            >Agregar</button>
        </div> : <div
            className={"absolute bottom-6 right-2 z-[900] p-2 flex bg-primary hover:bg-primary-light text-white rounded-md shadow-sm shadow-black cursor-pointer transition-colors"}
            onClick={() => setOpen(true)}
        >
            <IoMdAdd />
        </div>
    )

}

export default ShapeInput;