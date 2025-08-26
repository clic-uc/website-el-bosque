import {Map} from "../../types/Map";
import {AnyShape, PointShape} from "../../types/Shape.tsx";
import {useConfig} from "../../hooks/useConfig.tsx";
import {FeatureGroup, MapContainer, Marker, Polygon, Polyline, TileLayer} from "react-leaflet";
import {EditControl} from "react-leaflet-draw";
import {useCallback, useEffect, useRef, useState} from "react";
import {twMerge} from "tailwind-merge";
import SidePanel from "./SidePanel.tsx";
import {v4} from "uuid";
import {LatLng, type LeafletEventHandlerFnMap} from "leaflet";
import DrawHooks from "../../hooks/useDrawHooks.tsx";
import ShapeInput from "./ShapeInput.tsx";

interface MapDisplayProps {
    maps: Map[];
    activeMap: Map;
    onCreateShape: (shape: AnyShape, success: (shape: AnyShape) => void, errorCallback: (error: string) => void) => void;
    onUpdateShape: (shape: AnyShape, success: (shape: AnyShape) => void,  errorCallback: (error: string) => void) => void;
    onDeleteShape: (shapeId: string, success: () => void, errorCallback: (error: string) => void) => void;
    className?: string;
}

const parsePolyLatLngs = (latLngs: LatLng[][]) => {
    return latLngs.map(latLngArray => {
        return latLngArray.map(latLng => [latLng.lat, latLng.lng] as [number, number]);
    });
}

const parseLineLatLngs = (latLngs: LatLng[]) => {
    return latLngs.map(latLng => [latLng.lat, latLng.lng] as [number, number]);
}

const parsePointLatLng = (latLng: LatLng) => {
    return [latLng.lat, latLng.lng] as [number, number];
}

const MapDisplay: React.FC<MapDisplayProps> = (
    {maps, activeMap, onCreateShape, onUpdateShape, onDeleteShape, className},
) => {

    const config = useConfig();

    const [selectedShape, setSelectedShape] = useState<AnyShape | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        setShapes(props.map.shapes || []);
    }, [props.map.shapes]); 

    const layerRefs = useRef<Record<string, any>>({});
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const inputGroupRef = useRef<L.FeatureGroup>(null);

    useEffect(() => {
        layerRefs.current = {};
    }, [activeMap.id]); // Clear layer refs when active map changes

    useEffect(() => {
        Object.keys(layerRefs.current).forEach(id => {
            const layer = layerRefs.current[id];
            if (selectedShape && id === selectedShape.id) {
                layer.editing.enable();
            } else {
                layer.editing.disable();
            }
        })
    }, [selectedShape]);

    const disabledDrawOptions: typeof EditControl.prototype.props.draw = {
        circle: false,
        circlemarker: false,
        rectangle: false,
        marker: false,
        polyline: false,
        polygon: false,
    }

    const mergedClassNames = twMerge(
        className || "",
        "relative overflow-hidden"
    );

    const save = useCallback((newAttributes: Record<string, string | number | boolean>) => {
        if (!selectedShape) return;

        const newShape: AnyShape = {
            ...selectedShape,
            attributes: newAttributes
        };
        
        onUpdateShape(
            newShape,
            () => {
                setSelectedShape(null);
            },
            (error) => setError(error)
        )
    }, [selectedShape, onUpdateShape]);
    
    const cancel = useCallback(() => {
        setSelectedShape(null);
    }, []);

    const eventHandlers: (shape: AnyShape) => LeafletEventHandlerFnMap = (shape) => ({
        click: () => {
            setSelectedShape(shape);
        },
        remove: () => {
            onDeleteShape(
                shape.id,
                () => {
                    setSelectedShape(null);
                    delete layerRefs.current[shape.id];
                },
                error => setError(error)
            );
        },
    })
    
    const onInputCreate = useCallback((shape: AnyShape) => {
        onCreateShape(
            shape,
            (newShape) => {
                setSelectedShape(newShape);
            },
            (error) => setError(error)
        );
    }, [onCreateShape]);

    const onDrawCreate = useCallback(v => {
        const supportedTypes = ["polyline", "polygon", "marker"];

        if (!supportedTypes.includes(v.layerType)) {
            console.error("Unsupported shape type:", v.layerType);
            return;
        }

        if (featureGroupRef.current) {
            v.layer.remove();
            featureGroupRef.current.removeLayer(v.layer);
        }

        let shape: AnyShape;

        switch (v.layerType) {
            case "polygon": {
                shape = {
                    type: "poly",
                    layerId: "",
                    id: v4(),
                    coordinates: parsePolyLatLngs(v.layer.getLatLngs()),
                    attributes: {}
                }
                break;
            }
            case "polyline": {
                shape = {
                    type: "line",
                    layerId: "",
                    id: v4(),
                    coordinates: parseLineLatLngs(v.layer.getLatLngs()),
                    attributes: {}
                }
                break;
            }
            default: {
                shape = {
                    type: "point",
                    layerId: "",
                    id: v4(),
                    coordinates: parsePointLatLng(v.layer.getLatLng()),
                    attributes: {}
                }
                break;
            }
        }
        
        onCreateShape(
            shape,
            (newShape) => {
                setSelectedShape(newShape);
            },
            (error) => setError(error)
        );
        
    }, [onCreateShape]);

    const onEditMove = useCallback(v => {
        const shapeId = Object.keys(layerRefs.current).find(id => layerRefs.current[id] === v.layer);
        if (!shapeId) return;
        const shape = activeMap.shapes.find(s => s.id === shapeId);
        if (!shape || shape.type !== "point") return;

        if (featureGroupRef.current) {
            v.layer.remove();
            featureGroupRef.current.removeLayer(v.layer);
        }

        const newCoordinates = parsePointLatLng(v.layer.getLatLng());

        const updatedShape: PointShape = {
            ...shape,
            coordinates: newCoordinates,
        };
        
        onUpdateShape(
            updatedShape,
            (newShape) => {
                if (selectedShape && selectedShape.id === shapeId) {
                    setSelectedShape(newShape);
                }
            },
            (error) => setError(error)
        );
        
    }, [activeMap.shapes, onUpdateShape, selectedShape]);
    
    const onEditVertex = useCallback(v => {
        const shapeId = Object.keys(layerRefs.current).find(id => layerRefs.current[id] === v.poly);
        if (!shapeId) return;
        const shape = activeMap.shapes.find(s => s.id === shapeId);
        if (!shape || (shape.type !== "poly" && shape.type !== "line")) return;

        if (featureGroupRef.current) {
            v.layer.remove();
            featureGroupRef.current.removeLayer(v.layer);
        }

        let updatedShape: AnyShape;
        if (shape.type === "poly") {
            updatedShape = {
                ...shape,
                coordinates: parsePolyLatLngs(v.poly.getLatLngs())
            }
        } else {
            updatedShape = {
                ...shape,
                coordinates: parseLineLatLngs(v.poly.getLatLngs())
            }
        }
        
        onUpdateShape(
            updatedShape,
            (newShape) => {
                if (selectedShape && selectedShape.id === shapeId) {
                    setSelectedShape(newShape);
                }
            },
            (error) => setError(error)
        );
    }, [activeMap.shapes, onUpdateShape, selectedShape]);

    const markerDrawOptions = {
        ...disabledDrawOptions,
        marker: {}
    };

    const pointDrawOptions = {
        ...disabledDrawOptions,
        polyline: {}
    };

    const polyDrawOptions = {
        ...disabledDrawOptions,
        polygon: {}
    };

    return (
        <div className={mergedClassNames}>
            <MapContainer
                center={[
                    (config.mapBounds.maxLatitude + config.mapBounds.minLatitude) / 2,
                    (config.mapBounds.maxLongitude + config.mapBounds.minLongitude) / 2
                ]}
                zoom={14}
                bounds={[[config.mapBounds.minLatitude, config.mapBounds.minLongitude], [config.mapBounds.maxLatitude, config.mapBounds.maxLongitude]]}
            >
                <TileLayer
                    url={config.mapUrl}
                />
                {maps.map(
                    map => (
                        <FeatureGroup
                            key={map.id}
                            ref={el => {
                                if (el && map === activeMap) {
                                    featureGroupRef.current = el;
                            }}}
                        >
                            {
                                map === activeMap && map.drawable && (
                                    <>
                                        <EditControl
                                            onCreated={onDrawCreate}
                                            onEditMove={onEditMove}
                                            onEditVertex={onEditVertex}
                                            draw={map === activeMap ?
                                                map.shapeType === "point" ?
                                                    markerDrawOptions :
                                                    map.shapeType === "line" ?
                                                        pointDrawOptions :
                                                        polyDrawOptions :
                                                disabledDrawOptions}
                                            edit={map === activeMap ? {
                                                remove: {},
                                                edit: false,
                                            } : {remove: false, edit: false}}
                                            position={"topright"}
                                        />
                                    </>
                                )
                            }
                            {map.shapes.map(shape => {
                                switch (shape.type) {
                                    case "poly":
                                        return (
                                            <Polygon
                                                ref={el => {
                                                    if (el && layerRefs.current && map === activeMap) {
                                                        layerRefs.current[shape.id] = el;
                                                    }
                                                }}
                                                key={shape.id}
                                                positions={shape.coordinates}
                                                eventHandlers={map === activeMap ? eventHandlers(shape) : {}}
                                            />
                                        )
                                    case "line":
                                        return (
                                            <Polyline
                                                ref={el => {
                                                    if (el && layerRefs.current && map === activeMap) {
                                                        layerRefs.current[shape.id] = el;
                                                    }
                                                }}
                                                key={shape.id}
                                                positions={shape.coordinates}
                                                eventHandlers={map === activeMap ? eventHandlers(shape) : {}}
                                            />
                                        )
                                    case "point":
                                        return (
                                            <Marker
                                                ref={el => {
                                                    if (el && layerRefs.current && map === activeMap) {
                                                        layerRefs.current[shape.id] = el;
                                                    }
                                                }}
                                                key={shape.id}
                                                position={shape.coordinates}
                                                eventHandlers={map === activeMap ? eventHandlers(shape) : {}}
                                            >
                                            </Marker>
                                        )
                                }
                            })}
                        </FeatureGroup>
                    )
                )}
            </MapContainer>
            <SidePanel
                shape={selectedShape}
                mapAttributes={activeMap.attributes}
                open={selectedShape !== null}
                cancel={cancel}
                save={save}
            />
            {
                activeMap.drawable && !selectedShape && (
                    <ShapeInput
                        type={activeMap.shapeType}
                        onCreate={onInputCreate}
                        inputGroupRef={inputGroupRef}
                    />
                )
            }
        </div>
    )
}

export default MapDisplay;