import { Pipe, PipeTransform } from "@angular/core";
import { Observable, of } from "rxjs";

@Pipe({
    name: "appAsObservable",
    standalone: false
})
export class AppAsObservablePipe implements PipeTransform {

    public transform<T>(input: T): Observable<T> {
        return of(input);
    }
}
