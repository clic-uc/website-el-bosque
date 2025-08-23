import {AnyShape} from "./Shape.tsx";

export interface Map {
    id: number;
    name: string;
    attributes: Attribute[];
    drawable: boolean;
    shapeType: "point" | "line" | "poly";
    shapes: AnyShape[];
}

export type Attribute = {
    id: string;
    name: string;
    type: "string" | "number" | "boolean" | "date";
}