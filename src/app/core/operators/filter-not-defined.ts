import { OperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

export function filterNotDefined<T>(): OperatorFunction<T | undefined, undefined> {
    return function (src$: Observable<T | undefined>): Observable<undefined> {
        return src$.pipe(
            filter((v): v is undefined => v === undefined)
        );
    }
}
