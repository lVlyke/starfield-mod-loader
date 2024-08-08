import _ from "lodash";

export namespace LangUtils {

    /** @description Determines if two objects are value-equal by a deep comparison of the objects. */
    export function isEqual(a: unknown, b: unknown): boolean {
        return _.isEqualWith(a, b, function (value: any, other: any): boolean | undefined {

            // Preserve ordering of `Map` keys during comparison as they are de facto order-dependent
            if (value instanceof Map && other instanceof Map) {
                return isEqual(Array.from(value.entries()), Array.from(other.entries()));
            }

            return undefined;
        });
    }
}
