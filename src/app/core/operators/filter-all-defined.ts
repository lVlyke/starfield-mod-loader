import { OperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

type Always<T> = Exclude<Exclude<T, null>, undefined>;
type AlwaysAll<T extends unknown[]> = { [I in keyof T]: Always<T[I]>; };

export function filterAllDefined<T extends unknown[]>(): OperatorFunction<T, AlwaysAll<T>> {
    return function (src$: Observable<T>): Observable<AlwaysAll<T>> {
        return src$.pipe(
            filter((arr): arr is AlwaysAll<T> => arr.every(v => v !== null && v !== undefined))
        );
    }
}
