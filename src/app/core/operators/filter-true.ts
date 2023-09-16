import { OperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

export function filterTrue(): OperatorFunction<boolean, true> {
    return function (src$: Observable<boolean>): Observable<true> {
        return src$.pipe(
            filter((v): v is true => v === true)
        );
    }
}
