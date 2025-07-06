import useCoordinates from "../../../hooks/useCoordinates.jsx";
import {TILE_SIZE, useMap} from "../MapDisplay.jsx";
import {useState} from "react";

const OverlayShape = ({
    type,
    coordinates,
    id,
    color = {stroke: "#000000", fill: "#FFFFFF"},
    onClick = () => {},
    hoverText = "",
    popupContent = null,
}) => {

    const { zoom, tileBounds, openSidePanel, closeSidePanel } = useMap();

    const { getXYCoordinates } = useCoordinates();

    const [popupOpen, setPopupOpen] = useState(false);

    const genericProps = {
        fill: color.fill ? color.fill : "#FFFFFF",
        stroke: color.stroke ? color.stroke : "#000000",
        strokeWidth: 2,
        onClick: (e) => {
            e.stopPropagation();
            if (!popupOpen && popupContent) {
                setPopupOpen(true);
            }
            onClick(e);
        },
        className: "hover:stroke-[4px] transition-[stroke-width] duration-300 cursor-pointer",
    }

    if (!type || !coordinates || !id) {
        return null;
    }

    let posX = 0;
    let posY = 0;
    let width = 0;
    let height = 0;
    let shape = null;
    switch (type) {
        case "rect": {
            if (!coordinates.topLeft || !coordinates.bottomRight) {
                return null;
            }

            const topLeft = getXYCoordinates(coordinates.topLeft.lon, coordinates.topLeft.lat, zoom);
            const bottomRight = getXYCoordinates(coordinates.bottomRight.lon, coordinates.bottomRight.lat, zoom);

            posX = Math.floor((topLeft.x - tileBounds.minX) * TILE_SIZE);
            posY = Math.floor((topLeft.y - tileBounds.minY) * TILE_SIZE);

            width = Math.floor((bottomRight.x - topLeft.x) * TILE_SIZE);
            height = Math.floor((bottomRight.y - topLeft.y) * TILE_SIZE);

            shape = <rect
                x={0}
                y={0}
                width={width}
                height={height}
                {...genericProps}
            />;
            break;
        }
        case "poly": {
            if (!Array.isArray(coordinates) || coordinates.length < 3) {
                return null;
            }

            const xyCoordinates = coordinates.map(point => getXYCoordinates(point.lon, point.lat, zoom));

            const minX = Math.min(...xyCoordinates.map(point => point.x));
            const minY = Math.min(...xyCoordinates.map(point => point.y));

            posX = Math.floor(Math.min(...xyCoordinates.map(point => (point.x - tileBounds.minX) * TILE_SIZE)));
            posY = Math.floor(Math.min(...xyCoordinates.map(point => (point.y - tileBounds.minY) * TILE_SIZE)));

            width = Math.floor(Math.max(...xyCoordinates.map(point => (point.x - tileBounds.minX) * TILE_SIZE)) - posX);
            height = Math.floor(Math.max(...xyCoordinates.map(point => (point.y - tileBounds.minY) * TILE_SIZE)) - posY);

            const points = xyCoordinates.map(point => {
                return `${Math.floor((point.x - minX) * TILE_SIZE)},${Math.floor((point.y - minY) * TILE_SIZE)}`;
            }).join(" ");

            shape = <polygon
                points={points}
                {...genericProps}
            />;
            break;
        }
    }
    return <div
        className={`flex flex-col items-center justify-center group`}
        style={{
            position: "absolute",
            left: posX,
            top: posY,
            width: width,
            height: height,
        }}
        onClick={(e) => {
            e.stopPropagation();
            openSidePanel(
                <div>
                    <p>{hoverText}</p>
                    <button onClick={closeSidePanel}>Cerrar</button>
                </div>
            )
        }}
    >
        {hoverText && <div className={"absolute group-hover:opacity-100 opacity-0 transition-opacity duration-300 cursor-pointer p-2 bg-white border rounded shadow-md"}>
            <p className={`max-w-[${width * 0.9}px] text-center text-sm font-semibold`}>{hoverText}</p>
        </div>}
        <svg viewBox={`-5 -5 ${width+5} ${height+5}`} width={width} height={height}>
            {shape}
        </svg>
    </div>
}

export default OverlayShape;