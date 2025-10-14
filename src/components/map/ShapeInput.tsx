import {AnyShape} from "../../types/Shape.tsx";
import {useEffect, useState} from "react";
import {IoMdAdd, IoMdClose} from "react-icons/io";

interface ShapeInputProps {
    type: "point" | "line" | "poly";
    onCreate: (shape: AnyShape) => void;
    inputGroupRef: React.RefObject<L.FeatureGroup | null>;
}

const ShapeInput: React.FC<ShapeInputProps> = (props) => {

    useEffect(() => {
        return () => {
            if (props.inputGroupRef.current) {
                props.inputGroupRef.current.clearLayers();
            }
        }
    })

    const [open, setOpen] = useState<boolean>(false);

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