import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { filterDefined } from "../core/operators";

@Pipe({
    name: "appFilterDefined$",
    standalone: false
})
export class AppFilterDefinedPipe implements PipeTransform {

    public transform<T>(input: Observable<T | undefined>): Observable<T> {
        return input.pipe(
            filterDefined()
        );
    }
}
