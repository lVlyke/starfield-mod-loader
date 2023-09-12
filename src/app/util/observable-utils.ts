import { Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";

export namespace ObservableUtils {

    export function hotResult$<T>(result$: Observable<T>): Observable<T> {
        const hotResult$ = result$.pipe(shareReplay(1));
        hotResult$.subscribe();
        return hotResult$;
    }
}