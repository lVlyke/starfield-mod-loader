import { GamePluginProfileRef } from "../models/game-plugin-profile-ref";

export namespace ProfileUtils {

    export function getPluginType(pluginRef: GamePluginProfileRef): string | undefined {
        const [[, result]] = pluginRef.plugin.matchAll(/\.([^.]+)$/g) ?? [[undefined, undefined]];
        return result;
    }

    export function getPluginTypeIndex(
        pluginRef: GamePluginProfileRef,
        pluginTypeOrder: string[]
    ): number | undefined {
        const refType = getPluginType(pluginRef);

        return refType ? pluginTypeOrder.indexOf(refType.toLowerCase()) : undefined;
    }
}