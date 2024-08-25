import { AppData } from "./app-data";
import { AppDependenciesInfo } from "./app-dependency-info";
import { AppBaseProfile, AppProfile } from "./app-profile";
import { AppResource } from "./app-resource";
import { AppSettingsUserCfg } from "./app-settings-user-cfg";
import { ExternalFile } from "./external-file";
import { GameDatabase } from "./game-database";
import { GameId } from "./game-id";
import { GamePluginProfileRef } from "./game-plugin-profile-ref";
import { ModImportRequest, ModImportResult } from "./mod-import-status";
import { ModProfileRef } from "./mod-profile-ref";

export type AppMessage
    = AppMessage.AppMessage
    | AppMessage.ProfileMessage;

export type AppMessageData<I extends AppMessage["id"]> = (AppMessage & { id: I })["data"];
export type AppMessageResult<I extends AppMessage["id"]> = (AppMessage & { id: I })["result"];

type _AppMessage = AppMessage;

export namespace AppMessage {

    export type Prefix = typeof PREFIX;

    export const PREFIX = "app";

    export interface Base {
        id: string;
        data?: unknown;
        result?: unknown;
    }

    // App messages:

    export interface SyncUiState extends Base {
        id: `${Prefix}:syncUiState`;
        data: {
            appState: AppData;
            modListCols: string[];
            defaultModListCols: string[];
        };
    }

    export interface ChooseDirectory extends Base {
        id: `${Prefix}:chooseDirectory`;
        data: {
            baseDir?: string;
        };
        result?: string;
    }

    export interface ChooseFilePath extends Base {
        id: `${Prefix}:chooseFilePath`;
        data: {
            baseDir?: string;
            fileTypes?: string[];
        };
        result?: string;
    }

    export interface VerifyPathExists extends Base {
        id: `${Prefix}:verifyPathExists`;
        data: {
            path: string | string[];
            dirname?: boolean;
        };
        result?: string;
    }

    export interface OpenFile extends Base {
        id: `${Prefix}:openFile`;
        data: {
            path: string;
        };
        result: Pick<ExternalFile, "data" | "path" | "mimeType">;
    }

    export interface LoadProfileList extends Base {
        id: `${Prefix}:loadProfileList`;
        result: AppProfile.Description[];
    }

    export interface LoadSettings extends Base {
        id: `${Prefix}:loadSettings`;
        result: AppSettingsUserCfg | null;
    }

    export interface SaveSettings extends Base {
        id: `${Prefix}:saveSettings`;
        data: {
            settings: AppSettingsUserCfg;
        };
    }

    export interface NewProfile extends Base {
        id: `${Prefix}:newProfile`;
    }

    export interface DeleteProfile extends Base {
        id: `${Prefix}:deleteProfile`;
        data: {
            profile: AppProfile;
        };
    }

    export interface LoadProfile extends Base {
        id: `${Prefix}:loadProfile`;
        data: {
            name: string;
            gameId: string;
        };
        result?: AppProfile;
    }

    export interface LoadExternalProfile extends Base {
        id: `${Prefix}:loadExternalProfile`;
        data: {
            profilePath?: string;
        };
        result?: AppProfile;
    }

    export interface SaveProfile extends Base {
        id: `${Prefix}:saveProfile`;
        data: {
            profile: AppProfile;
        };
    }

    export interface VerifyProfile extends Base {
        id: `${Prefix}:verifyProfile`;
        data: {
            profile: AppProfile;
        };
        result: AppProfile.VerificationResults;
    }

    export interface CopyProfileData extends Base {
        id: `${Prefix}:copyProfileData`;
        data: {
            srcProfile: AppProfile;
            destProfile: AppProfile;
        };
    }

    export interface ShowPreferences extends Base {
        id: `${Prefix}:showPreferences`;
    }

    export interface LoadGameDatabase extends Base {
        id: `${Prefix}:loadGameDatabase`;
        result: GameDatabase;
    }

    export interface FindBestProfileDefaults extends Base {
        id: `${Prefix}:findBestProfileDefaults`;
        data: {
            gameId: GameId;
        };
        result: AppProfile.DefaultablePaths;
    }

    export interface ShowAboutInfo extends Base {
        id: `${Prefix}:showAboutInfo`;
        data: {
            depsInfo: AppDependenciesInfo;
            depsLicenseText: string;
        };
    }

    export interface ToggleModListColumn extends Base {
        id: `${Prefix}:toggleModListColumn`;
        data: {
            column?: string;
            reset?: boolean;
        };
    }

    export interface CheckLinkSupported extends Base {
        id: `${Prefix}:checkLinkSupported`;
        data: {
            targetPath: string;
            destPaths: string[];
            symlink: boolean;
            symlinkType?: "file" | "dir" | "junction";
        };
        result: boolean;
    }
    
    export interface ResolveResourceUrl extends Base {
        id: `${Prefix}:resolveResourceUrl`;
        data: {
            resource: AppResource;
        };
        result: string | undefined;
    }

    export type AppMessage = SyncUiState
                           | ChooseDirectory
                           | ChooseFilePath
                           | VerifyPathExists
                           | OpenFile
                           | LoadProfileList
                           | LoadSettings
                           | SaveSettings
                           | NewProfile
                           | DeleteProfile
                           | LoadProfile
                           | LoadExternalProfile
                           | SaveProfile
                           | VerifyProfile
                           | CopyProfileData
                           | ShowPreferences
                           | LoadGameDatabase
                           | FindBestProfileDefaults
                           | ShowAboutInfo
                           | ToggleModListColumn
                           | CheckLinkSupported
                           | ResolveResourceUrl;

    // Profile messages:

    export namespace ProfileMessage {
       
        export type Prefix = typeof PREFIX;

        export const PREFIX = "profile";
    }

    export interface ResolveProfilePath extends Base {
        id: `${ProfileMessage.Prefix}:resolvePath`;
        data: {
            profile: AppProfile;
            pathKeys: Array<keyof AppProfile>;
        };
        result: Array<string | undefined>;
    }

    export interface MoveProfileFolder extends Base {
        id: `${ProfileMessage.Prefix}:moveFolder`;
        data: {
            oldProfile: AppProfile;
            newProfile: AppProfile;
            pathKey: keyof AppProfile;
            overwrite: boolean;
            destructive: boolean;
        };
    }

    export interface ProfileSettings extends Base {
        id: `${ProfileMessage.Prefix}:settings`;
        data: {
            profile: AppProfile;
        };
    }

    export interface BeginModAdd extends Base {
        id: `${ProfileMessage.Prefix}:beginModAdd`;
        data: {
            profile: AppProfile;
            modPath?: string;
            root?: boolean;
        };
        result?: ModImportRequest;
    }

    export interface BeginModExternalImport extends Base {
        id: `${ProfileMessage.Prefix}:beginModExternalImport`;
        data: {
            profile: AppProfile;
            modPath?: string;
            root?: boolean;
        };
        result?: ModImportRequest;
    }

    export interface CompleteModImport extends Base {
        id: `${ProfileMessage.Prefix}:completeModImport`;
        data: {
            importRequest: ModImportRequest;
        };
        result?: ModImportResult;
    }

    export interface DeleteProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:deleteMod`;
        data: {
            profile: AppProfile;
            modName: string;
        };
    }

    export interface RenameProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:renameMod`;
        data: {
            profile: AppProfile;
            modCurName: string;
            modNewName: string;
        };
    }

    export interface ReadProfileModFilePaths extends Base {
        id: `${ProfileMessage.Prefix}:readModFilePaths`;
        data: {
            profile: AppProfile;
            modName: string;
            normalizePaths?: boolean;
        };
        result: string[];
    }

    export interface FindPluginFiles extends Base {
        id: `${ProfileMessage.Prefix}:findPluginFiles`;
        data: {
            profile: AppProfile;
        };
        result: GamePluginProfileRef[];
    }

    export interface FindModFiles extends Base {
        id: `${ProfileMessage.Prefix}:findModFiles`;
        data: {
            profile: AppProfile;
        };
        result: AppProfile.ModList;
    }

    export interface ImportProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:importPluginBackup`;
        data: {
            profile: AppProfile;
            backupPath: string;
        };
        result: AppProfile;
    }

    export interface CreateProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:createPluginBackup`;
        data: {
            profile: AppProfile;
            backupName?: string;
        };
    }

    export interface DeleteProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:deletePluginBackup`;
        data: {
            profile: AppProfile;
            backupFile: string;
        };
    }

    export interface ReadProfilePluginBackups extends Base {
        id: `${ProfileMessage.Prefix}:readPluginBackups`;
        data: {
            profile: AppProfile;
        };
        result: AppProfile.PluginBackupEntry[];
    }

    export interface ExportProfilePluginList extends Base {
        id: `${ProfileMessage.Prefix}:exportPluginList`;
        data: {
            profile: AppProfile;
        };
    }

    export interface CheckArchiveInvalidationEnabled extends Base {
        id: `${ProfileMessage.Prefix}:checkArchiveInvalidationEnabled`;
        data: {
            profile: AppProfile | AppBaseProfile | AppProfile.Form;
        };
        result: boolean;
    }

    export interface SetArchiveInvalidationEnabled extends Base {
        id: `${ProfileMessage.Prefix}:setArchiveInvalidationEnabled`;
        data: {
            profile: AppProfile;
            enabled: boolean;
        };
    }

    export interface DeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:deploy`;
        data: {
            profile: AppProfile;
            deployPlugins: boolean;
            normalizePathCasing: boolean;
        };
    }

    export interface UndeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:undeploy`;
        data: {
            profile: AppProfile;
        };
    }

    export interface FindDeployedProfile extends Base {
        id: `${ProfileMessage.Prefix}:findDeployedProfile`;
        data: {
            refProfile: AppProfile;
        };
        result?: string;
    }

    export interface FindProfileExternalFiles extends Base {
        id: `${ProfileMessage.Prefix}:findExternalFiles`;
        data: {
            profile: AppProfile;
        };
        result: AppProfile.ExternalFiles;
    }

    export interface ShowModInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showModInFileExplorer`;
        data: {
            profile: AppProfile;
            modName: string;
            modRef: ModProfileRef;
        };
    }

    export interface ShowGameModDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showGameModDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileBaseDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileBaseDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileModsDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileModsDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileConfigDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileConfigDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowGameRootDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showGameRootDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfilePluginBackupsInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfilePluginBackupsInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface LaunchGame extends Base {
        id: `${ProfileMessage.Prefix}:launchGame`;
        data: {
            profile: AppProfile;
        };
    }

    export interface OpenGameConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:openGameConfigFile`;
        data: {
            configPaths: string[];
        };
    }

    export interface OpenProfileConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:openProfileConfigFile`;
        data: {
            profile: AppProfile;
            configFileName: string;
        };
    }

    export interface ReadConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:readConfigFile`;
        data: {
            profile: AppProfile;
            fileName: string;
            loadDefaults: boolean;
        };
        result: string;
    }

    export interface UpdateConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:updateConfigFile`;
        data: {
            profile: AppProfile;
            fileName: string;
            data: string;
        };
    }

    export interface ProfileDirLinkSupported extends Base {
        id: `${ProfileMessage.Prefix}:dirLinkSupported`;
        data: {
            profile: AppProfile;
            srcDir: keyof AppProfile;
            destDirs: Array<keyof AppProfile>;
            symlink: boolean;
            symlinkType?: "file" | "dir" | "junction";
        };
        result: boolean;
    }

    export interface ResolveGameBinaryVersion extends Base {
        id: `${ProfileMessage.Prefix}:resolveGameBinaryVersion`;
        data: {
            profile: AppProfile;
        };
        result?: string;
    }

    export type ProfileMessage = ResolveProfilePath
                               | MoveProfileFolder
                               | ProfileSettings
                               | BeginModAdd
                               | BeginModExternalImport
                               | CompleteModImport
                               | DeleteProfileMod
                               | RenameProfileMod
                               | ReadProfileModFilePaths
                               | FindPluginFiles
                               | FindModFiles
                               | ImportProfilePluginBackup
                               | CreateProfilePluginBackup
                               | DeleteProfilePluginBackup
                               | ReadProfilePluginBackups
                               | ExportProfilePluginList
                               | CheckArchiveInvalidationEnabled
                               | SetArchiveInvalidationEnabled
                               | DeployProfile
                               | UndeployProfile
                               | FindDeployedProfile
                               | FindProfileExternalFiles
                               | ShowModInFileExplorer
                               | ShowGameModDirInFileExplorer
                               | ShowProfileBaseDirInFileExplorer
                               | ShowGameRootDirInFileExplorer
                               | ShowProfileModsDirInFileExplorer
                               | ShowProfileConfigDirInFileExplorer
                               | ShowProfilePluginBackupsInFileExplorer
                               | LaunchGame
                               | OpenGameConfigFile
                               | OpenProfileConfigFile
                               | ReadConfigFile
                               | UpdateConfigFile
                               | ProfileDirLinkSupported
                               | ResolveGameBinaryVersion;

    // Message record:

    export const record: Array<_AppMessage["id"]> = [
        "app:syncUiState",
        "app:chooseDirectory",
        "app:chooseFilePath",
        "app:verifyPathExists",
        "app:openFile",
        "app:loadProfileList",
        "app:loadSettings",
        "app:saveSettings",
        "app:newProfile",
        "app:deleteProfile",
        "app:loadProfile",
        "app:loadExternalProfile",
        "app:saveProfile",
        "app:copyProfileData",
        "app:verifyProfile",
        "app:showPreferences",
        "app:loadGameDatabase",
        "app:findBestProfileDefaults",
        "app:showAboutInfo",
        "app:toggleModListColumn",
        "app:checkLinkSupported",
        "app:resolveResourceUrl",

        "profile:resolvePath",
        "profile:moveFolder",
        "profile:settings",
        "profile:beginModAdd",
        "profile:beginModExternalImport",
        "profile:completeModImport",
        "profile:deleteMod",
        "profile:renameMod",
        "profile:readModFilePaths",
        "profile:findPluginFiles",
        "profile:findModFiles",
        "profile:importPluginBackup",
        "profile:createPluginBackup",
        "profile:deletePluginBackup",
        "profile:readPluginBackups",
        "profile:exportPluginList",
        "profile:checkArchiveInvalidationEnabled",
        "profile:setArchiveInvalidationEnabled",
        "profile:deploy",
        "profile:undeploy",
        "profile:findDeployedProfile",
        "profile:findExternalFiles",
        "profile:showModInFileExplorer",
        "profile:showGameModDirInFileExplorer",
        "profile:showProfileBaseDirInFileExplorer",
        "profile:showProfileModsDirInFileExplorer",
        "profile:showProfileConfigDirInFileExplorer",
        "profile:showGameRootDirInFileExplorer",
        "profile:showProfilePluginBackupsInFileExplorer",
        "profile:launchGame",
        "profile:openGameConfigFile",
        "profile:openProfileConfigFile",
        "profile:readConfigFile",
        "profile:updateConfigFile",
        "profile:resolveGameBinaryVersion"
    ];
}