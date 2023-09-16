import { OperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

export function filterFalse(): OperatorFunction<boolean, false> {
    return function (src$: Observable<boolean>): Observable<false> {
        return src$.pipe(
            filter((v): v is false => v === false)
        );
    }
}
