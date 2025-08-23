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

interface MapDisplayProps {
    map: Map;
    onCreateShape?: (shape: AnyShape, success: () => void, errorCallback: (error: string) => void) => void;
    onUpdateShape?: (shape: AnyShape, success: () => void,  errorCallback: (error: string) => void) => void;
    onDeleteShape?: (shapeId: string, success: () => void, errorCallback: (error: string) => void) => void;
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

const MapDisplay: React.FC<MapDisplayProps> = (props) => {

    const config = useConfig();

    const [shapes, setShapes] = useState<AnyShape[]>(props.map.shapes || []);
    const [selectedShape, setSelectedShape] = useState<AnyShape | null>(null);
    const [saveMode, setSaveMode] = useState<"create" | "update" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const layerRefs = useRef<Record<string, any>>({});

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

    const drawOptions: typeof EditControl.prototype.props.draw = {
        circle: false,
        circlemarker: false,
        rectangle: false,
        marker: props.map.shapeType === "point" ? {} : false,
        polyline: props.map.shapeType === "line" ? {} : false,
        polygon: props.map.shapeType === "poly" ? {} : false,
    }

    const disabledDrawOptions: typeof EditControl.prototype.props.draw = {
        circle: false,
        circlemarker: false,
        rectangle: false,
        marker: false,
        polyline: false,
        polygon: false,
    }

    const mergedClassNames = twMerge(
        props.className || "",
        "relative overflow-hidden"
    );

    const save = useCallback((newAttributes: Record<string, string | number | boolean>) => {
        if (!selectedShape) return;

        const newShape: AnyShape = {
            ...selectedShape,
            attributes: newAttributes
        };

        const fn = saveMode === "create" ? props.onCreateShape : props.onUpdateShape;

        if (fn) {
            fn(
                newShape,
                () => {
                    setShapes(prev => prev.map(shape => shape.id === selectedShape.id ? newShape : shape));
                    setSelectedShape(null);
                },
                (error) => setError(error)
            )
        } else {
            setShapes(prev => prev.map(shape => shape.id === selectedShape.id ? newShape : shape));
            setSelectedShape(null);
        }

    }, [selectedShape, saveMode, props.onCreateShape, props.onUpdateShape]);

    const cancel = useCallback(() => {
        setSelectedShape(null);
    }, [selectedShape, saveMode]);

    const eventHandlers: (shape: AnyShape) => LeafletEventHandlerFnMap = (shape) => ({
        click: () => {
            setSelectedShape(shape);
            setSaveMode("update");
        },
        remove: () => {
            if (props.onDeleteShape) {
                props.onDeleteShape(
                    shape.id,
                    () => {
                        setShapes(prev => prev.filter(s => s.id !== shape.id));
                        setSelectedShape(null);
                    },
                    error => setError(error)
                );
            } else {
                setShapes(prev => prev.filter(s => s.id !== shape.id));
                setSelectedShape(null);
            }
        },
    })

    const onCreate = useCallback(v => {
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
                    id: v4(),
                    coordinates: parsePolyLatLngs(v.layer.getLatLngs()),
                    attributes: {}
                }
                break;
            }
            case "polyline": {
                shape = {
                    type: "line",
                    id: v4(),
                    coordinates: parseLineLatLngs(v.layer.getLatLngs()),
                    attributes: {}
                }
                break;
            }
            default: {
                shape = {
                    type: "point",
                    id: v4(),
                    coordinates: parsePointLatLng(v.layer.getLatLng()),
                    attributes: {}
                }
                break;
            }
        }

        setShapes(prev => [...prev, shape]);
        setSelectedShape(shape);
        setSaveMode("create");
    }, []);

    const onEditMove = useCallback(v => {
        const shapeId = Object.keys(layerRefs.current).find(id => layerRefs.current[id] === v.layer);
        if (!shapeId) return;
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape || shape.type !== "point") return;

        const newCoordinates = parsePointLatLng(v.layer.getLatLng());

        const updatedShape: PointShape = {
            ...shape,
            coordinates: newCoordinates,
        };

        const undoEdit = () => {
            setShapes(prev => prev.map(s => s.id === shapeId ? shape : s));
            v.layer.setLatLng([shape.coordinates[0], shape.coordinates[1]]);
        }

        if (props.onUpdateShape) {
            props.onUpdateShape(
                updatedShape,
                () => {
                    setShapes(prev => prev.map(s => s.id === shapeId ? updatedShape : s));
                    if (selectedShape && selectedShape.id === shapeId) {
                        setSelectedShape(updatedShape);
                    }
                },
                () => undoEdit()
            );
        } else {
            setShapes(prev => prev.map(s => s.id === shapeId ? updatedShape : s));
            if (selectedShape && selectedShape.id === shapeId) {
                setSelectedShape(updatedShape);
            }
        }
    }, [shapes, props.onUpdateShape, selectedShape]);

    const onEditVertex = useCallback(v => {
        const shapeId = Object.keys(layerRefs.current).find(id => layerRefs.current[id] === v.poly);
        if (!shapeId) return;
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape || (shape.type !== "poly" && shape.type !== "line")) return;


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

        const undoEdit = () => {
            setShapes(prev => prev.map(s => s.id === shapeId ? shape : s));
            v.layer.setLatLngs(shape.coordinates);
        }

        if (props.onUpdateShape) {
            props.onUpdateShape(
                updatedShape,
                () => {
                    setShapes(prev => prev.map(s => s.id === shapeId ? updatedShape : s));
                    if (selectedShape && selectedShape.id === shapeId) {
                        setSelectedShape(updatedShape);
                    }
                },
                () => undoEdit()
            );
        } else {
            setShapes(prev => prev.map(s => s.id === shapeId ? updatedShape : s));
            if (selectedShape && selectedShape.id === shapeId) {
                setSelectedShape(updatedShape);
            }
        }
    }, [shapes, props.onUpdateShape, selectedShape]);

    const featureGroupRef = useRef<L.FeatureGroup>(null);

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
                <FeatureGroup ref={featureGroupRef}>
                    <DrawHooks onCreate={onCreate} onEditMove={onEditMove} onEditVertex={onEditVertex} />
                    <EditControl
                        draw={selectedShape && props.map.drawable ? disabledDrawOptions : drawOptions}
                        edit={{
                            remove: selectedShape === null && props.map.drawable ? {} : false,
                            edit: selectedShape === null && props.map.drawable ? {} : false,
                        }}
                        position={"topright"}
                    />
                    {shapes.map(shape => {
                        switch (shape.type) {
                            case "poly":
                                return (
                                    <Polygon
                                        ref={el => {
                                            if (el && layerRefs.current) {
                                                layerRefs.current[shape.id] = el;
                                            }
                                        }}
                                        key={shape.id}
                                        positions={shape.coordinates}
                                        eventHandlers={eventHandlers(shape)}
                                    />
                                )
                            case "line":
                                return (
                                    <Polyline
                                        ref={el => {
                                            if (el && layerRefs.current) {
                                                layerRefs.current[shape.id] = el;
                                            }
                                        }}
                                        key={shape.id}
                                        positions={shape.coordinates}
                                        eventHandlers={eventHandlers(shape)}
                                    />
                                )
                            case "point":
                                return (
                                    <Marker
                                        ref={el => {
                                            if (el && layerRefs.current) {
                                                layerRefs.current[shape.id] = el;
                                            }
                                        }}
                                        key={shape.id}
                                        position={shape.coordinates}
                                        eventHandlers={eventHandlers(shape)}
                                    >
                                    </Marker>
                                )
                        }
                    })}
                </FeatureGroup>
            </MapContainer>
            <SidePanel
                shape={selectedShape}
                mapAttributes={props.map.attributes}
                open={selectedShape !== null}
                cancel={cancel}
                save={save}
            />
        </div>
    )
}

export default MapDisplay;