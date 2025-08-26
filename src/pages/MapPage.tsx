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

    const dummyMap: Map = {
        id: 1,
        name: "Dummy Map",
        attributes: [
            {id: "1", name: "Name", type: "string"},
            {id: "2", name: "Height", type: "number"},
            {id: "3", name: "Is Active", type: "boolean"},
            {id: "4", name: "Created At", type: "date"},
        ],
        shapeType: "line",
        drawable: true,
        shapes: dummyShapes
    }
    const layers = [
        { id: "poly", name: "Polígonos" },
        { id: "line", name: "Líneas" },
        { id: "punto1", name: "Punto1" },
        { id: "punto2", name: "Punto 2" }
    ]
    const dummyShapes2: AnyShape[] = [
        {
            id: "shape1_2",
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
            shapes: dummyShapes1
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
            shapes: dummyShapes2
        }
    );

    const maps = useMemo(() => [dummyMap1, dummyMap2], [dummyMap1, dummyMap2]);

    const activeMap = dummyMap1;
    const setActiveMap = setDummyMap1;

    const [activeLayers, setActiveLayers] = useState<string[]>(layers.map((l) => l.id));

      const handleToggleLayer = (id: string) => {
        setActiveLayers((prev) =>
        prev.includes(id) ? prev.filter((layer) => layer !== id) : [...prev, id]
        );
  };
    return (
    <div className="flex w-screen h-screen">
      {/* Sidebar */}
      <SideBar
        layers={layers}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* Mapa */}
      <div className="flex-1">
        <MapDisplay
            maps={maps}
            activeMap={activeMap}
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
                const index = activeMap.shapes.findIndex(s => s.id === shape.id);
                if (index === -1) {
                    errorCallback("Shape not found");
                    return;
                }
                setActiveMap(
                    prev => {
                        const newShapes = [...prev.shapes];
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