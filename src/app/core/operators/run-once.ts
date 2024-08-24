import { Observable } from "rxjs";
import { take } from "rxjs/operators";
import { hot } from "./hot";

export function runOnce<T>(input$: Observable<T>, subscribe: boolean = true): Observable<T> {
    input$ = hot(input$).pipe(take(1));

    if (subscribe) {
        input$.subscribe();
    }

    return input$;
}