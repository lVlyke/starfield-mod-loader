export namespace RelativeOrderedMap {

    export type List<K, V> = Array<[K, V]>;

    export function insert<K, V>(list: List<K, V>, key: K, value: V): void {
        const entry = getEntry(list, key);

        if (entry) {
            entry[1] = value;
        } else {
            list.push([key, value]);
        }
    }

    export function insertAt<K, V>(list: List<K, V>, key: K, value: V, index: number): void {
        const oldEntry = getEntry(list, key);

        if (index >= list.length) {
            insert(list, key, value);
        } else {
            list.splice(index, 0, [key, value]);
        }

        if (!!oldEntry) {
            list.splice(list.indexOf(oldEntry), 1);
        }
    }

    export function insertBefore<K, V>(list: List<K, V>, key: K, value: V, before: K): void {
        const beforeIndex = indexOf(list, before);
        if (beforeIndex !== undefined) {
            insertAt(list, key, value, beforeIndex);
        } else {
            insert(list, key, value);
        }
    }

    export function insertAfter<K, V>(list: List<K, V>, key: K, value: V, after: K): void {
        const afterIndex = indexOf(list, after);
        if (afterIndex !== undefined) {
            insertAt(list, key, value, afterIndex + 1);
        } else {
            insert(list, key, value);
        }
    }

    export function at<K, V>(list: List<K, V>, index: number): [K, V] | undefined {
        if (index < 0 || index >= list.length) {
            return undefined;
        }

        return list[index];
    }

    export function has<K, V>(list: List<K, V>, key: K): boolean {
        return !!get(list, key);
    }

    export function get<K, V>(list: List<K, V>, key: K): V | undefined {
        return getEntry(list, key)?.[1];
    }

    export function next<K, V>(list: List<K, V>, key: K): [K, V] | undefined {
        const keyIndex = indexOf(list, key);
        return keyIndex !== undefined ? at(list, keyIndex + 1) : undefined;
    }

    export function previous<K, V>(list: List<K, V>, key: K): [K, V] | undefined {
        const keyIndex = indexOf(list, key);
        return keyIndex !== undefined ? at(list, keyIndex - 1) : undefined;
    }

    export function erase<K, V>(list: List<K, V>, key: K): boolean {
        const index = indexOf(list, key);

        if (index !== undefined) {
            list.splice(index, 1);
            return true;
        }

        return false;
    }

    export function indexOf<K, V>(list: List<K, V>, key: K): number | undefined {
        const result = list.findIndex(([searchKey]) => key === searchKey);
        return result === -1 ? undefined : result;
    }

    export function entries<K, V>(list: List<K, V>): Array<[K, V]> {
        return list.slice(0);
    }

    export function keys<K, V>(list: List<K, V>): Array<K> {
        return list.map(([key]) => key);
    }

    export function values<K, V>(list: List<K, V>): Array<V> {
        return list.map(([, value]) => value);
    }

    export function forEach<K, V>(list: List<K, V>, fn: (value: V, key: K, index: number) => void): void {
        entries(list).forEach(([key, value], index) => fn(value, key, index));
    }

    function getEntry<K, V>(list: List<K, V>, key: K): [K, V] | undefined {
        return list.find(([searchKey]) => key === searchKey);
    }
}