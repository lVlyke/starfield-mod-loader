import { Injectable } from "@angular/core";
import { State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";

@State<AppProfile | null>({
    name: "activeProfile",
    defaults: null,
    children: []
})
@Injectable()
export class ActiveProfileState {
}

export namespace ActiveProfileState {

    export type Context = StateContext<AppProfile | {}>;
}