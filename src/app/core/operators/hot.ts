import { Observable } from "rxjs";
import { share } from "rxjs/operators";

export function hot<T>(input$: Observable<T>): Observable<T> {
    return input$.pipe(share());
}