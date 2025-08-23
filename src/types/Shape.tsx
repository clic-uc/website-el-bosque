export interface Shape {
    id: string;
    attributes: Record<string, string | number | boolean>;
}

export interface PointShape extends Shape {
    type: "point";
    coordinates: [number, number]; // [longitude, latitude]
}

export interface LineShape extends Shape {
    type: "line";
    coordinates: [number, number][]; // Array of [longitude, latitude]
}

export interface PolyShape extends Shape {
    type: "poly";
    coordinates: [number, number][][]; // Array of linear rings, each ring is an array of [longitude, latitude]
}

export type AnyShape = PointShape | LineShape | PolyShape;