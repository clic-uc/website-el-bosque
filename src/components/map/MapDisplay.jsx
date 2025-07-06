import {createContext, useContext, useEffect, useRef, useState} from "react";
import useCoordinates from "../../hooks/useCoordinates.jsx";
import {HiOutlineZoomIn, HiOutlineZoomOut} from "react-icons/hi";
import SearchBar from "./components/SearchBar.jsx";

const MapContext = createContext({
    mapBounds: {
        maxLon: 0,
        maxLat: 0,
        minLon: 0,
        minLat: 0
    },
    zoom: 0,
    tileBounds: {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    },
    openSidePanel: () => {},
    closeSidePanel: () => {},
    centerAt: () => {},
    position: { x: 0, y: 0 },
    viewportBounds: {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    }
})

export const TILE_SIZE = 256; // Size of a tile in pixels

const MapDisplay = ({
    initialPosition,
    topLeft,
    bottomRight,
    initialZoom,
    minZoom,
    maxZoom,
    classNames,
    mapId,
    children
}) =>{

    const [zoom, setZoom] = useState(initialZoom < minZoom ? minZoom : initialZoom > maxZoom ? maxZoom : initialZoom);
    const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
    const [viewportBounds, setViewportBounds] = useState({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
    });
    const [moving, setMoving] = useState(false);
    const [sidePanel, setSidePanel] = useState(null);
    const [mapBounds, setMapBounds] = useState({
        maxLon: bottomRight.lon,
        maxLat: topLeft.lat,
        minLon: topLeft.lon,
        minLat: bottomRight.lat
    });

    const { getTile, getXYCoordinates } = useCoordinates();

    const displayRef = useRef(null);

    const minTiles = getTile(topLeft.lon, topLeft.lat, zoom);
    const maxTiles = getTile(bottomRight.lon, bottomRight.lat, zoom);

    const xDiff = maxTiles.x - minTiles.x + 1;
    const yDiff = maxTiles.y - minTiles.y + 1;

    useEffect(() => {
        setViewportBounds({
            minX: - position.x,
            minY: - position.y,
            maxX: - position.x + (displayRef.current?.getBoundingClientRect().width || 0),
            maxY: - position.y + (displayRef.current?.getBoundingClientRect().height || 0),
        })
    }, [position, displayRef]);

    useEffect(() => {
        setMapBounds({
            maxLon: bottomRight.lon,
            maxLat: topLeft.lat,
            minLon: topLeft.lon,
            minLat: bottomRight.lat
        });
    }, [topLeft, bottomRight]);
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        setMoving(true);
    }

    const handleMouseUp = (e) => {
        e.preventDefault();
        setMoving(false);
        const correctX = Math.max(Math.min(position.x, 0), displayRef.current.clientWidth - xDiff * TILE_SIZE);
        const correctY = Math.max(Math.min(position.y, 0), displayRef.current.clientHeight - yDiff * TILE_SIZE);
        setPosition({
            x: correctX,
            y: correctY
        });
    }

    const handleMouseMove = (e) => {
        e.preventDefault();
        if (moving) {
            const deltaX = e.movementX;
            const deltaY = e.movementY;
            setPosition({
                x: position.x + deltaX,
                y: position.y + deltaY
            });
        }
    }

    const handleWheel = (e) => {
        e.preventDefault();
    }

    const openSidePanel = (children) => {
        setSidePanel(children);
    }

    const closeSidePanel = () => {
        setSidePanel(null);

        const correctX = Math.max(Math.min(position.x, 0), displayRef.current.clientWidth - xDiff * TILE_SIZE);
        const correctY = Math.max(Math.min(position.y, 0), displayRef.current.clientHeight - yDiff * TILE_SIZE);
        setPosition({
            x: correctX,
            y: correctY
        });

    }

    const centerAt = (lon, lat) => {

        const {x, y} = getXYCoordinates(lon, lat, zoom);
        const newX = -((x - minTiles.x) * TILE_SIZE) + (displayRef.current?.getBoundingClientRect().width || 0) / 2;
        const newY = -((y - minTiles.y) * TILE_SIZE) + (displayRef.current?.getBoundingClientRect().height || 0) / 2;

        setPosition({
            x: newX,
            y: newY
        });

    }

    const handleZoomIn = () => {

        if (zoom >= maxZoom) return;

        setZoom(prev => Math.min(prev + 1, maxZoom));

        const currentCenterX = (-position.x + (displayRef.current?.getBoundingClientRect().width || 0) / 2) / TILE_SIZE + minTiles.x;
        const currentCenterY = (-position.y + (displayRef.current?.getBoundingClientRect().height || 0) / 2) / TILE_SIZE + minTiles.y;

        const newMinTiles = getTile(topLeft.lon, topLeft.lat, zoom + 1);

        const newCenterX = (currentCenterX * 2 - newMinTiles.x) * TILE_SIZE - (displayRef.current?.getBoundingClientRect().width || 0) / 2;
        const newCenterY = (currentCenterY * 2 - newMinTiles.y) * TILE_SIZE - (displayRef.current?.getBoundingClientRect().height || 0) / 2;

        setPosition({
            x: -newCenterX,
            y: -newCenterY
        });
    }

    const handleZoomOut = () => {

        if (zoom <= minZoom) return;

        setZoom(prev => Math.max(prev - 1, minZoom));

        const currentCenterX = (-position.x + (displayRef.current?.getBoundingClientRect().width || 0) / 2) / TILE_SIZE + minTiles.x;
        const currentCenterY = (-position.y + (displayRef.current?.getBoundingClientRect().height || 0) / 2) / TILE_SIZE + minTiles.y;

        const newMinTiles = getTile(topLeft.lon, topLeft.lat, zoom - 1);

        const newCenterX = (currentCenterX / 2 - newMinTiles.x) * TILE_SIZE - (displayRef.current?.getBoundingClientRect().width || 0) / 2;
        const newCenterY = (currentCenterY / 2 - newMinTiles.y) * TILE_SIZE - (displayRef.current?.getBoundingClientRect().height || 0) / 2;

        setPosition({
            x: -newCenterX,
            y: -newCenterY
        });

    }

    return <div className={`flex flex-row ${classNames.container} overflow-hidden relative`}>
        <MapContext.Provider value={{
            mapBounds,
            zoom,
            tileBounds: {
                minX: minTiles.x,
                minY: minTiles.y,
                maxX: maxTiles.x,
                maxY: maxTiles.y
            },
            openSidePanel,
            closeSidePanel,
            centerAt,
            position,
            viewportBounds
        }}>
            <div className={"z-10 absolute bottom-5 left-5 flex flex-row items-center select-none"}>
                <div
                    className={"bg-white rounded-l-md shadow-lg overflow-hidden p-2 border-r border-gray-200 cursor-pointer group"}
                    onClick={handleZoomOut}
                >
                    <HiOutlineZoomOut className={"group-hover:text-gray-600 transition-colors"} />
                </div>
                <div
                    className={"bg-white rounded-r-md shadow-lg overflow-hidden p-2 border-l border-gray-200 cursor-pointer group"}
                    onClick={handleZoomIn}
                >
                    <HiOutlineZoomIn className={"group-hover:text-gray-600 transition-colors"} />
                </div>
                <p className={"ml-2 text"}>Zoom: {zoom}</p>
            </div>
            <SearchBar />
            <div
                className={`overflow-hidden flex-grow relative`}
                id={`map-${mapId}`}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                ref={displayRef}
            >
                <div style={{
                    position: 'absolute',
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: moving ? 'grabbing' : 'grab',
                    width: `${xDiff * TILE_SIZE}px`,
                    height: `${yDiff * TILE_SIZE}px`,
                    overflow: 'hidden',
                }}>

                    {children}
                </div>
            </div>
            <div className={`flex h-full z-10 bg-white transition-[width] overflow-hidden shadow-2xl ${sidePanel ? "p-2 w-[10rem]" : "w-0"}`}>
                {sidePanel && sidePanel}
            </div>
        </MapContext.Provider>
    </div>

}

export const useMap = () => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error("useMap must be used within a MapProvider");
    }
    return context;
}

export default MapDisplay;