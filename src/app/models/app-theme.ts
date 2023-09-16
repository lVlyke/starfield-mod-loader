export enum AppTheme {
    Default = "default",
    Dark = "dark"
}

export namespace AppTheme {

    export function values(): AppTheme[] {
        return [
            AppTheme.Default,
            AppTheme.Dark
        ];
    }
}
