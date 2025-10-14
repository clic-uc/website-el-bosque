import {Map} from "../../types/Map";
import {AnyShape, PointShape} from "../../types/Shape.tsx";
import {useConfig} from "../../hooks/useConfig.tsx";
import {FeatureGroup, MapContainer, Marker, Polygon, Polyline, TileLayer} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {EditControl} from "react-leaflet-draw";
import {useCallback, useEffect, useRef, useState} from "react";
import {twMerge} from "tailwind-merge";
import SidePanel from "./SidePanel.tsx";
import {v4} from "uuid";
import {LatLng, type LeafletEventHandlerFnMap} from "leaflet";
import ShapeInput from "./ShapeInput.tsx";

interface MapDisplayProps {
    maps: Map[];
    activeMap: Map;
    activeMaps?: number[];
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
    {maps, activeMap, activeMaps, onCreateShape, onUpdateShape, onDeleteShape, className},
) => {

    const config = useConfig();

    const [selectedShape, setSelectedShape] = useState<AnyShape | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Debug: log when selectedShape changes
    useEffect(() => {
        console.log('🔍 selectedShape changed:', selectedShape?.id || 'null');
    }, [selectedShape]);
    
    // Preserve selectedShape when maps update (shapes array recreated)
    // If selectedShape exists but is stale (different instance with same ID),
    // update it with the fresh instance from activeMap
    useEffect(() => {
        if (selectedShape && activeMap) {
            const freshShape = activeMap.shapes.find(s => s.id === selectedShape.id);
            // Only update if we found the shape AND it's a different instance
            if (freshShape && freshShape !== selectedShape) {
                console.log('🔄 Updating selectedShape with fresh instance:', freshShape.id);
                setSelectedShape(freshShape);
            } else if (!freshShape) {
                // Shape was removed from the map, deselect it
                console.log('❌ Selected shape removed from map, deselecting');
                setSelectedShape(null);
            }
        }
    }, [activeMap, activeMap.shapes, selectedShape]);
    
    const layerRefs = useRef<Record<string, any>>({});
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const inputGroupRef = useRef<L.FeatureGroup>(null);

    useEffect(() => {
        layerRefs.current = {};
    }, [activeMap.id]); // Clear layer refs when active map changes

    useEffect(() => {
        Object.keys(layerRefs.current).forEach(id => {
            const layer = layerRefs.current[id];
            
            // Defensive check: ensure layer and editing exist
            // Markers inside MarkerClusterGroup may be removed from DOM when clustered
            if (!layer || !layer.editing) {
                return;
            }
            
            try {
                if (selectedShape && id === selectedShape.id) {
                    layer.editing.enable();
                } else {
                    layer.editing.disable();
                }
            } catch (error) {
                // Silently handle errors when layer is no longer in the map
                // (e.g., marker clustered or removed)
                console.debug('Could not toggle editing for layer:', id, error);
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

    // `v` is the event object from react-leaflet-draw. Use `any` here to avoid
    // deep typings; keep implementation unchanged.
    const onDrawCreate = useCallback((v: any) => {
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

    // `v` is the edit event from react-leaflet-draw
    const onEditMove = useCallback((v: any) => {
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
    
    // `v` is the vertex edit event from react-leaflet-draw
    const onEditVertex = useCallback((v: any) => {
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
                {maps.filter(map => !activeMaps || activeMaps.includes(map.id)).map(map => {
                    const pointShapes = map.shapes.filter(shape => shape.type === "point");
                    const nonPointShapes = map.shapes.filter(shape => shape.type !== "point");
                    
                    return (
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
                                            draw={map.shapeType === "point" ?
                                                markerDrawOptions :
                                                map.shapeType === "line" ?
                                                    pointDrawOptions :
                                                    polyDrawOptions}
                                            edit={{
                                                remove: {},
                                                edit: false,
                                            }}
                                            position={"topright"}
                                        />
                                    </>
                                )
                            }
                            
                            {/* Non-point shapes (polygons and polylines) */}
                            {nonPointShapes.map(shape => {
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
                                    default:
                                        return null;
                                }
                            })}
                            
                            {/* Point shapes with clustering */}
                            <MarkerClusterGroup
                                chunkedLoading
                                maxClusterRadius={50}
                                spiderfyOnMaxZoom={true}
                                showCoverageOnHover={false}
                                zoomToBoundsOnClick={true}
                            >
                                {pointShapes.map(shape => (
                                    <Marker
                                        ref={el => {
                                            // Store ref when marker is mounted
                                            if (el && layerRefs.current && map === activeMap) {
                                                layerRefs.current[shape.id] = el;
                                            }
                                            // When el is null (marker unmounted/clustered),
                                            // DON'T delete the ref - keep it for state tracking
                                            // This allows selectedShape to remain active even when clustered
                                        }}
                                        key={shape.id}
                                        position={shape.coordinates}
                                        eventHandlers={map === activeMap ? eventHandlers(shape) : {}}
                                    />
                                ))}
                            </MarkerClusterGroup>
                        </FeatureGroup>
                    );
                })}
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