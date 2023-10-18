import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { filterDefined } from "../core/operators";

@Pipe({
    name: "appFilterDefined$"
})
export class AppFilterDefinedPipe implements PipeTransform {

    public transform<T>(input: Observable<T | undefined>): Observable<T> {
        return input.pipe(
            filterDefined()
        );
    }
}
