import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { delay } from "rxjs/operators";

@Pipe({
    name: "appDelay$"
})
export class AppDelayPipe implements PipeTransform {

    public transform<T>(input: Observable<T>, delayMs: number): Observable<T> {
        return input.pipe(
            delay(delayMs)
        );
    }
}
