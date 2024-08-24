import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_SNACK_BAR_DATA, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";
import { log } from "../../util/logger";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { LangUtils } from "../../util/lang-utils";

@Component({
    templateUrl: "./profile-verification-results.modal.html",
    styleUrls: ["./profile-verification-results.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        MatButtonModule,
        MatSnackBarModule
    ]
})
export class AppProfileVerificationResultsModal extends BaseComponent {

    private static readonly VERIFICATION_ERROR_DESCS: Record<keyof AppProfile.VerificationResults, string> = {
        name: "Invalid profile name",
        gameId: "Invalid Game ID",
        mods: "Invalid or missing mod files",
        rootMods: "Invalid or missing root mod files",
        plugins: "Invalid plugins",
        rootPathOverride: "Invalid Profile Root directory",
        modsPathOverride: "Invalid Profile Mods directory",
        configPathOverride: "Invalid Profile Config directory",
        savesPathOverride: "Invalid Profile Saves directory",
        backupsPathOverride: "Invalid Profile Backups directory",
        deployed: "Invalid deployment state",
        gameRootDir: "Invalid Game Root directory",
        gameModDir: "Invalid Game Data directory",
        gameBinaryPath: "Invalid Game Executable path",
        gamePluginListPath: "Invalid Plugin List path",
        gameConfigFilePath: "Invalid Config File path",
        gameSaveFolderPath: "Invalid Save Folder path",
        manageExternalPlugins: "Invalid external plugin management state",
        manageConfigFiles: "Invalid Config File Management state",
        manageSaveFiles: "Invalid Save File Management state",
        modLinkMode: "Invalid Mod Link Mode state",
        configLinkMode: "Invalid Config Link Mode state",
        externalFilesCache: "Invalid external files",
        baseProfile: "Invalid Base Profile",
        error: "Invalid Profile",
        found: "Invalid Profile"
    }

    protected readonly errors: string[];

    constructor(
        cdRef: ChangeDetectorRef,
        protected readonly snackBarRef: MatSnackBarRef<AppProfileVerificationResultsModal>,
        @Inject(MAT_SNACK_BAR_DATA) verificationResults: AppProfile.VerificationResults
    ) {
        super({ cdRef });

        this.errors = LangUtils.entries(verificationResults).reduce<string[]>((errors, [propertyKey, verificationResult]) => {
            const hasError = [
                propertyKey === "error" && verificationResult,
                propertyKey === "found" && !verificationResult,
                typeof verificationResult !== "boolean" && verificationResult.error,
            ].some(Boolean);

            if (hasError) {
                const errorText = AppProfileVerificationResultsModal.VERIFICATION_ERROR_DESCS[propertyKey];
                log.error(`Profile verification error:`, errorText, verificationResult);
                errors.push(errorText);
            }
            
            return errors;
        }, []);
    }
}
