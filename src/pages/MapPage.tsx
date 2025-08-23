import "leaflet/dist/leaflet.css"
import MapDisplay from "../components/map/MapDisplay.tsx";
import {Map} from "../types/Map.tsx";
import {AnyShape, Shape} from "../types/Shape.tsx";

const MapPage = () => {

    const dummyShapes: AnyShape[] = [
        {
            id: "shape1",
            type: "poly",
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
            coordinates: [-33.59220524202586, -70.75860376620324],
            attributes: {
                "1": "Point 3",
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

    return (
        <MapDisplay
            map={dummyMap}
            className={"w-[100vw] h-[100vh]"}
            onCreateShape={(shape, success, errorCallback) => {
                console.log("Shape created:", shape);
                success();
            }}
            onUpdateShape={(shape, success, errorCallback) => {
                console.log("Shape updated:", shape);
                success();
            }}
            onDeleteShape={(shape, success, errorCallback) => {
                console.log("Shape deleted:", shape);
                success();
            }}
        />
    )
}

export default MapPage;