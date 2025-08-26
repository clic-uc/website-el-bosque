import "leaflet/dist/leaflet.css"
import MapDisplay from "../components/map/MapDisplay.tsx";
import {Map} from "../types/Map.tsx";
import {AnyShape, Shape} from "../types/Shape.tsx";
import SideBar from "../components/map/SideBar.tsx";
import { useState } from "react";

const MapPage = () => {

    const dummyShapes: AnyShape[] = [
        {
            id: "shape1",
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
            id: "shape2",
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
            id: "shape3",
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
          map={{
            ...dummyMap,
            shapes: dummyMap.shapes.filter((s) => activeLayers.includes(s.layerId)), 
          }}
          className="w-full h-full"
          onCreateShape={(shape, success) => {
            console.log("Shape created:", shape);
            success();
          }}
          onUpdateShape={(shape, success) => {
            console.log("Shape updated:", shape);
            success();
          }}
          onDeleteShape={(shape, success) => {
            console.log("Shape deleted:", shape);
            success();
          }}
        />
      </div>
    </div>
  )
}


export default MapPage;