export interface BasicActionOptions {
    merge?: boolean;
}

export type BasicAction<ModelT, EntityK extends keyof ModelT> = {
    [K in EntityK]: ModelT[K];
} & {
    options: BasicActionOptions;
}

export namespace BasicAction {

    export interface Constructor<ModelT, EntityK extends keyof ModelT> {
        type: string;
        new(payload?: ModelT[EntityK], options?: BasicActionOptions): BasicAction<ModelT, EntityK>;
    }

    export function create<ModelT, EntityK extends keyof ModelT>(stateName: string, verb: string, entity: EntityK): Constructor<ModelT, EntityK> {
        return class {
            public static readonly type = `[${stateName}] ${verb} ${entity as string}`;

            constructor(payload?: ModelT[EntityK], public options: BasicActionOptions = {}) {
                (this as any)[entity] = payload;
            }
        } as any;
    }
}
