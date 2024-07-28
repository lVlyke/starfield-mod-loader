import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_SNACK_BAR_DATA, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";

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

    protected readonly errors: string[] = [];

    constructor(
        cdRef: ChangeDetectorRef,
        protected readonly snackBarRef: MatSnackBarRef<AppProfileVerificationResultsModal>,
        @Inject(MAT_SNACK_BAR_DATA) verificationResults: AppProfile.VerificationResults
    ) {
        super({ cdRef });

        if (verificationResults.name.error) {
            this.errors.push("Invalid profile name");
        }

        if (verificationResults.gameId.error) {
            this.errors.push("Invalid Game ID");
        }

        if (verificationResults.modBaseDir.error) {
            this.errors.push("Invalid Mod Base Directory");
        }

        if (verificationResults.gameBaseDir.error) {
            this.errors.push("Invalid Game Base Directory");
        }

        if (verificationResults.gameBinaryPath.error) {
            this.errors.push("Invalid Game Executable Path");
        }

        if (verificationResults.pluginListPath.error) {
            this.errors.push("Invalid Plugin List Path");
        }

        if (verificationResults.configFilePath.error) {
            this.errors.push("Invalid Config File Path");
        }

        if (verificationResults.mods.error || verificationResults.rootMods.error) {
            this.errors.push("Invalid or missing mod files");
        }

        if (verificationResults.plugins.error) {
            this.errors.push("Invalid plugins");
        }
    }
}
