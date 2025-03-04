import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "appHex",
    standalone: false
})
export class AppHexPipe implements PipeTransform {

    public transform(value: number | string, hexPrefix: boolean = true): string {
        return `${hexPrefix ? "0x" : ""}${value.toString(16)}`;
    }
}
