import { concat, Observable } from "rxjs";
import { toArray } from "rxjs/operators";

type ConcatInput<T extends unknown[]> = { [I in keyof T]: Observable<T[I]> };

export function concatJoin<T extends unknown[]>(...input: ConcatInput<T>): Observable<T[number][]> {
    return concat(...input).pipe(
        toArray()
    );
}
