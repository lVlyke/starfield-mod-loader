import { Observable, Subscription } from "rxjs";
import { finalize, shareReplay, take } from "rxjs/operators";

export function runOnce<T>(input$: Observable<T>, subscribe: boolean = true): Observable<T> {
    let defaultSubscription: Subscription | undefined = undefined;

    input$ = input$.pipe(
        take(1),
        finalize(() => defaultSubscription?.unsubscribe()),
        shareReplay({
            bufferSize: 1,
            refCount: true
        })
    );

    if (subscribe) {
        defaultSubscription = input$.subscribe();
    }

    return input$;
}