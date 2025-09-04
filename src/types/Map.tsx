import {AnyShape} from "./Shape.tsx";

export interface Map {
    id: number;
    name: string;
    department: "edificacion" | "ejecucion" | "emergencias" | "vivienda";
    attributes: Attribute[];
    drawable: boolean;
    shapeType: "point" | "line" | "poly";
    shapes: AnyShape[];
    layers: Layer[];
}

export type Layer = {
    id: string;
    name: string;
}

export type Attribute = {
    id: string;
    name: string;
    type: "string" | "number" | "boolean" | "date";
}