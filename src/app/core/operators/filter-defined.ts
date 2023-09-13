import { OperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

type Always<T> = Exclude<Exclude<Exclude<T, null>, undefined>, void>;

export function filterDefined<T>(): OperatorFunction<T, Always<T>> {
    return function (src$: Observable<T>): Observable<Always<T>> {
        return src$.pipe(
            filter((v): v is Always<T> => v !== null && v !== undefined)
        );
    }
}
