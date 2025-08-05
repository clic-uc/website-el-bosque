import {Circle, FeatureGroup, MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import "leaflet/dist/leaflet.css"
import {EditControl} from "react-leaflet-draw";

const MapPage = () => {

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[51.505, -0.09]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker>
            <FeatureGroup>
                <EditControl
                    position='topright'
                    draw={{
                        rectangle: false
                    }}
                />
                <Circle center={[51.51, -0.06]} radius={200} />
            </FeatureGroup>
        </MapContainer>
    )
}

export default MapPage;