import { useEffect } from "react";
import {useMap} from "react-leaflet";

interface DrawHooksProps {
    onCreate: (v) => void;
    onEditMove: (v) => void;
    onEditVertex: (v) => void;
}

const DrawHooks: React.FC<DrawHooksProps> = (props) => {

    const map = useMap();

    useEffect(() => {
        map.on('draw:created', props.onCreate);
        map.on('draw:editmove', props.onEditMove);
        map.on('draw:editvertex', props.onEditVertex);

        return () => {
            map.off('draw:created', props.onCreate);
            map.off('draw:editmove', props.onEditMove);
            map.off('draw:editvertex', props.onEditVertex);
        };
    })

    return null;
}

export default DrawHooks;