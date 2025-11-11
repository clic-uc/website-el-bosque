export interface Shape {
    id: string;
    layerId: string
    attributes: Record<string, string | number | boolean | Array<{ title: string; url: string }> | Array<{ operation: string; comment: string }>>;
    icon?: string;
    iconColor?: string;
}

export interface PointShape extends Shape {
    type: "point";
    layerId: string
    coordinates: [number, number]; // [longitude, latitude]
}

export interface LineShape extends Shape {
    type: "line";
    layerId: string
    coordinates: [number, number][]; // Array of [longitude, latitude]
}

export interface PolyShape extends Shape {
    type: "poly";
    layerId: string
    coordinates: [number, number][][]; // Array of linear rings, each ring is an array of [longitude, latitude]
}

export type AnyShape = PointShape | LineShape | PolyShape;