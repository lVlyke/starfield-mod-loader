import { Pipe, PipeTransform } from "@angular/core";
import { AppProfile } from "../models/app-profile";

@Pipe({ name: "appProfileBackupName" })
export class AppProfileBackupNamePipe implements PipeTransform {

    public transform(backupEntry: AppProfile.BackupEntry): string {
        return backupEntry.filePath.replace(/\.[^.]+$/g, "");
    }
}
