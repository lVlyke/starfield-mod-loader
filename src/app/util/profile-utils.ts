import { GamePluginProfileRef } from "../models/game-plugin-profile-ref";

export namespace ProfileUtils {

    export function getDefaultPluginType(pluginRef: GamePluginProfileRef): string | undefined {
        const [[, result]] = pluginRef.plugin.matchAll(/\.([^.]+)$/g) ?? [[undefined, undefined]];
        return result;
    }

    export function getPluginType(pluginRef: GamePluginProfileRef): string | undefined {
        if (pluginRef.promotedType) {
            return pluginRef.promotedType;
        } else {
            return getDefaultPluginType(pluginRef);
        }
    }

    export function getPluginTypeIndex(
        pluginRef: GamePluginProfileRef,
        pluginTypeOrder: string[]
    ): number | undefined {
        const refType = getPluginType(pluginRef);

        return refType ? pluginTypeOrder.indexOf(refType.toLowerCase()) : undefined;
    }
}