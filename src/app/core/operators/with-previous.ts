import { Observable, OperatorFunction } from "rxjs";
import { tap, map } from "rxjs/operators";

export function withPrevious<T>(): OperatorFunction<T, [T, T | undefined]> {
    let prev: T | undefined;

    return function (src$: Observable<T>) {
        return src$.pipe(
            map<T, [T, T | undefined]>(v => [v, prev]),
            tap(([v]) => prev = v)
        );
    };
}
