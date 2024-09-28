import { Observable } from "rxjs";
import { share, ShareConfig } from "rxjs/operators";

export function hot<T>(input$: Observable<T>, options: ShareConfig<T> = {
    resetOnError: false,
    resetOnComplete: false,
    resetOnRefCountZero: false
}): Observable<T> {
    return input$.pipe(share(options));
}