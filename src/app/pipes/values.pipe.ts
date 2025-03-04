import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "appValues",
    standalone: false
})
export class AppValuesPipe implements PipeTransform {

    public transform<T>(value?: Record<any, T>): T[] {
        return Object.values(value ?? {});
    }
}
