import {useEffect, useState} from "react";
import useCoordinates from "../../../hooks/useCoordinates.jsx";
import {TILE_SIZE, useMap} from "../MapDisplay.jsx";

const MapLayer = ({z}) => {

    const { getTileUrl } = useCoordinates();
    const { zoom, tileBounds, viewportBounds } = useMap();

    const [tiles, setTiles] = useState([]);

    const updateTiles = () => {

        const xDiff = tileBounds.maxX - tileBounds.minX + 1;
        const yDiff = tileBounds.maxY - tileBounds.minY + 1;

        setTiles([
            ...Array.from({ length: xDiff * yDiff }, (_, i) => {
                const x = tileBounds.minX + i % xDiff;
                const y = tileBounds.minY + Math.floor(i / xDiff);
                const posX = x - tileBounds.minX;
                const posY = y - tileBounds.minY;
                return {
                    x,
                    y,
                    posX,
                    posY,
                    url: getTileUrl(x, y, zoom)
                }
            }).filter(
                tile => (tile.posX * TILE_SIZE <= viewportBounds.maxX && (tile.posX + 1) * TILE_SIZE) >= viewportBounds.minX && (
                    tile.posY * TILE_SIZE <= viewportBounds.maxY && (tile.posY + 1) * TILE_SIZE >= viewportBounds.minY
                )
            )
        ])
    }

    useEffect(updateTiles, [zoom, tileBounds, viewportBounds]);

    return <>
        <div
            className={`relative z-[${z || 0}]`}
        >
            {tiles && tiles.map(tile => {

                const style = {
                    position: "absolute",
                    left: `${tile.posX * TILE_SIZE}px`,
                    top: `${tile.posY * TILE_SIZE}px`
                }

                return <img key={`${tile.x}, ${tile.y}`} src={tile.url} alt={`${tile.x}, ${tile.y}`} loading={"lazy"} style={style} />
            })}
        </div>
    </>;

}

export default MapLayer;