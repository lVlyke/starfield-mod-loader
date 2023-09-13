export interface vec2<X = number, Y = number> {
    x: X;
    y: Y;
}

export interface vec3<X = number, Y = number, Z = number> extends vec2<X, Y> {
    z: Z;
}

export interface vec4<X = number, Y = number, Z = number, W = number> extends vec3<X, Y, Z> {
    w: W;
}

export namespace vec2 {

    export function instanceOf(value: any): value is vec2 {
        return value !== null && 
            value !== undefined && 
            typeof value === "object" && 
            "x" in value && 
            "y" in value && 
            typeof value.x === "number" && 
            typeof value.y === "number";
    }

    export function zero(): vec2 {
        return { x: 0, y: 0 };
    }

    export function one(): vec2 {
        return { x: 1, y: 1 };
    }
}

export namespace vec3 {

    export function instanceOf(value: any): value is vec3 {
        return !!vec2.instanceOf(value) && 
            "z" in value && 
            typeof (value as any).z === "number";
    }

    export function zero(): vec3 {
        return { x: 0, y: 0, z: 0 };
    }

    export function one(): vec3 {
        return { x: 1, y: 1, z: 1 };
    }
}

export namespace vec4 {

    export function instanceOf(value: any): value is vec4 {
        return !!vec3.instanceOf(value) && 
            ("w" in value) && 
            typeof (value as any).w === "number";
    }

    export function partialInstanceOf(value: any): value is Partial<vec4> {
        return value !== null && 
            value !== undefined && 
            typeof value === "object" && (
                ("x" in value && typeof value.x === "number") ||
                ("y" in value && typeof value.y === "number") ||
                ("z" in value && typeof value.z === "number") ||
                ("w" in value && typeof value.w === "number")
            );
    }

    export function zero(): vec4 {
        return { x: 0, y: 0, z: 0, w: 0 };
    }

    export function one(): vec4 {
        return { x: 1, y: 1, z: 1, w: 1 };
    }
}
