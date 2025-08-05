export interface Map {
    id: number;
    name: string;
    attributes: Attribute[];
    drawable: boolean;
    shapeType: "point" | "line" | "poly";
}

type Attribute = {
    id: string;
    name: string;
    type: "string" | "number" | "boolean" | "date";
}