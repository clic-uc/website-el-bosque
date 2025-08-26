import {useEffect} from "react";
import {useMap} from "react-leaflet";

interface DrawHooksProps {
    onCreate: (v) => void;
    onEditMove: (v) => void;
    onEditVertex: (v) => void;
}

const DrawHooks: React.FC<DrawHooksProps> = ({onCreate, onEditVertex, onEditMove}) => {

    const map = useMap();

    useEffect(() => {
        map.on('draw:created', onCreate);
        map.on('draw:editmove', onEditMove);
        map.on('draw:editvertex', onEditVertex);

        return () => {
            map.off('draw:created', onCreate);
            map.off('draw:editmove', onEditMove);
            map.off('draw:editvertex', onEditVertex);
        };
    })

    return null;
}

export default DrawHooks;