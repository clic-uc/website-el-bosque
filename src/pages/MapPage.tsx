import "leaflet/dist/leaflet.css"
import MapDisplay from "../components/map/MapDisplay.tsx";
import {Map} from "../types/Map.tsx";
import {AnyShape, Shape} from "../types/Shape.tsx";
import SideBar from "../components/map/SideBar.tsx";
import {useMemo, useState} from "react";

const MapPage = () => {

    const dummyShapes1: AnyShape[] = [
        {
            id: "shape1_1",
            type: "poly",
            layerId: "poly",
            coordinates: [[[-33.59220524202586, -70.75860376620324], [-33.5314107698844, -70.75860376620324], [-33.5314107698844, -70.64506335632365]]],
            attributes: {
                "1": "Poly 1",
                "2": 10,
                "3": true,
                "4": "2023-10-01",
            }
        },
        {
            id: "shape2_1",
            type: "line",
            layerId: "line",
            coordinates: [[-33.59220524202586, -70.64506335632365], [-33.5314107698844, -70.75860376620324]],
            attributes: {
                "1": "Line 2",
                "2": 20,
                "3": false,
                "4": "2023-10-02",
            }
        },
        {
            id: "shape3_1",
            type: "point",
            layerId: "punto1",
            coordinates: [-33.59220524202586, -70.75860376620324],
            attributes: {
                "1": "Point 3",
                "2": 30,
                "3": true,
                "4": "2023-10-03",
            }
        },
        {
          id: "shape4",
          type: "point",
          layerId: "punto2",
          coordinates: [-33.59220524202586, -70.64506335632365],
          attributes: {
            "1": "Point 4",
            "2": 30,
            "3": true,
            "4": "2023-10-03",
          }
        }
    ]

    const dummyShapes2: AnyShape[] = [
        {
            id: "shape1_2",
            layerId: "poly",
            type: "poly",
            coordinates: [[[-33.67220724202586, -70.75860376620324], [-33.5314107698844, -70.75860376620324], [-33.5314107698844, -70.64506335632365]]],
            attributes: {
                "1": "Poly 1",
                "2": 10,
                "3": true,
                "4": "2023-10-01",
            }
        },
        {
            id: "shape2_2",
            layerId: "line",
            type: "line",
            coordinates: [[-33.61220524202586, -70.64507335632365], [-33.5414107698844, -70.75860376620324]],
            attributes: {
                "1": "Line 2",
                "2": 20,
                "3": false,
                "4": "2023-10-02",
            }
        },
        {
            id: "shape3_2",
            layerId: "punto1",
            type: "point",
            coordinates: [-33.62220724202586, -70.75861376620324],
            attributes: {
                "1": "Point 3",
                "2": 30,
                "3": true,
                "4": "2023-10-03",
            }
        }
    ]

    const [dummyMap1, setDummyMap1] = useState<Map>(
        {
            id: 1,
            name: "Dummy Map",
            attributes: [
                {id: "1", name: "Name", type: "string"},
                {id: "2", name: "Height", type: "number"},
                {id: "3", name: "Is Active", type: "boolean"},
                {id: "4", name: "Created At", type: "date"},
            ],
            department: "edificacion",
            shapeType: "point",
            drawable: true,
            shapes: dummyShapes1,
            layers: [
                { id: "poly", name: "Polígonos" },
                { id: "line", name: "Líneas" },
                { id: "punto1", name: "Punto1" },
                { id: "punto2", name: "Punto 2" }
            ]
        }
    );

    const [dummyMap2, setDummyMap2] = useState<Map>(
        {
            id: 2,
            name: "Dummy Map 2",
            attributes: [
                {id: "1", name: "Name", type: "string"},
                {id: "2", name: "Capacity", type: "number"},
                {id: "3", name: "Is Active", type: "boolean"},
                {id: "4", name: "Updated At", type: "date"},
            ],
            department: "edificacion",
            shapeType: "line",
            drawable: true,
            shapes: dummyShapes2,
            layers: [
                { id: "poly", name: "Polígonos Map 2" },
                { id: "line", name: "Líneas Map 2" },
                { id: "punto1", name: "Punto1 Map 2" }
            ]
        }
    );

    const maps = useMemo(() => [dummyMap1, dummyMap2], [dummyMap1, dummyMap2]);

    // Estado para mapas activos (múltiples)
    const [activeMaps, setActiveMaps] = useState<number[]>([1]); // Por defecto solo el primer mapa
    
    // Estado para capas activas por mapa (objeto donde la clave es el ID del mapa)
    const [activeLayers, setActiveLayers] = useState<Record<number, string[]>>({
        1: dummyMap1.layers.map((l) => l.id),
        2: dummyMap2.layers.map((l) => l.id)
    });

    const handleToggleMap = (id: number) => {
        setActiveMaps((prev) =>
            prev.includes(id) ? prev.filter((mapId) => mapId !== id) : [...prev, id]
        );
    };

    const handleToggleLayer = (mapId: number, layerId: string) => {
        setActiveLayers((prev) => ({
            ...prev,
            [mapId]: prev[mapId]?.includes(layerId) 
                ? prev[mapId].filter((layer) => layer !== layerId) 
                : [...(prev[mapId] || []), layerId]
        }));
    };
    
    const mapsForDisplay = maps.map(map => ({
        ...map,
        shapes: map.shapes.filter(shape => activeLayers[map.id]?.includes(shape.layerId) || false)
    }));
    
    const activeMapsData = maps.filter(map => activeMaps.includes(map.id));
    
    const activeMap = activeMapsData[0] || maps[0];
    
    const getActiveMapSetter = () => {
        if (!activeMap) return setDummyMap1;
        return activeMap.id === 1 ? setDummyMap1 : setDummyMap2;
    };
    const setActiveMap = getActiveMapSetter();
    
    return (
    <div className="flex w-screen h-screen">
      {/* Sidebar */}
      <SideBar
        maps={maps}
        activeMaps={activeMaps}
        onToggleMap={handleToggleMap}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* Mapa */}
      <div className="flex-1">
        <MapDisplay
            maps={mapsForDisplay}
            activeMap={activeMap}
            activeMaps={activeMaps}
            className={"w-[100vw] h-[100vh]"}
            onCreateShape={(shape, success, errorCallback) => {
                console.log("Shape created:", shape);
                setActiveMap(
                    prev => ({...prev, shapes: [...prev.shapes, shape]})
                )
                success(shape);
            }}
            onUpdateShape={(shape, success, errorCallback) => {
                console.log("Shape updated:", shape);
                // Buscar en el mapa original (no filtrado) para obtener el índice correcto
                const originalMap = maps.find(m => m.id === activeMap.id);
                if (!originalMap) {
                    errorCallback("Map not found");
                    return;
                }
                const index = originalMap.shapes.findIndex(s => s.id === shape.id);
                if (index === -1) {
                    errorCallback("Shape not found");
                    return;
                }
                setActiveMap(
                    prev => {
                        const newShapes = [...prev.shapes];
                        newShapes[index] = shape;
                        newShapes[index] = shape;
                        return {...prev, shapes: newShapes};
                    }
                )
                success(shape);
            }}
            onDeleteShape={(shapeId, success, errorCallback) => {
                console.log("Shape deleted:", shapeId);
                setActiveMap(
                    prev => ({...prev, shapes: prev.shapes.filter(s => s.id !== shapeId)})
                )
                success();
            }}
        />
      </div>
    </div>
  )
}


export default MapPage;