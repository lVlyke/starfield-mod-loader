import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "appFlatten"
})
export class AppFlattenPipe implements PipeTransform {

    public transform<T>(values: T[][]): T[] {
        return values.flat();
    }
}
