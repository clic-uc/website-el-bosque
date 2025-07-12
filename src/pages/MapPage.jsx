import MapLayer from "../components/map/layers/MapLayer.jsx";
import MapDisplay from "../components/map/MapDisplay.jsx";
import OverlayLayer from "../components/map/layers/OverlayLayer.jsx";

const MapPage = () => {

    return (
        <MapDisplay
            topLeft={{lon: -70.75860376620324, lat:-33.5314107698844}}
            bottomRight={{lon: -70.64506335632365, lat: -33.59220524202586}}
            initialZoom={15}
            minZoom={14}
            maxZoom={19}
            classNames={{
                container: "m-auto w-[100vw] h-[100vh]",
            }}
            mapId={0}
        >
            <MapLayer />
            <OverlayLayer
                z={10}
                shapes={[
                    {
                        id: 1,
                        type: "poly",
                        coordinates: [
                            {lat: -33.56705874709786, lon: -70.67740632305711},
                            {lat: -33.57828671310991, lon: -70.66778819911015},
                            {lat: -33.57828671310991, lon: -70.67740632305711},
                            {lat: -33.55828671310991, lon: -70.687406323057}
                        ],
                        hoverText: "Parque Forestal",
                        color: {
                            fill: "rgba(255,0,59,0.25)",
                            stroke: "rgba(255,0,59,1)"
                        }
                    }
                ]}
            />
        </MapDisplay>
    )
}

export default MapPage;