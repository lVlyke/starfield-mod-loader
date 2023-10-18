/** Types exported from app for use in electron.js */

declare type AppMessage = import("./app/models/app-message").AppMessage;
declare type AppMessageData<I extends AppMessage["id"]> = import("./app/models/app-message").AppMessageData<I>;
declare type AppProfile = import("./app/models/app-profile").AppProfile;
declare type AppProfileVerificationResult = import("./app/models/app-profile").AppProfileVerificationResult;
declare type AppProfileVerificationResults = import("./app/models/app-profile").AppProfileVerificationResults;
declare type AppProfileModVerificationResult = import("./app/models/app-profile").AppProfileModVerificationResult;
declare type ModImportStatus = import("./app/models/mod-import-status").ModImportStatus;
declare type ModImportRequest = import("./app/models/mod-import-status").ModImportRequest;
declare type ModImportResult = import("./app/models/mod-import-status").ModImportResult;
declare type AppSettingsUserCfg = import("./app/models/app-settings-user-cfg").AppSettingsUserCfg;
declare type GameDatabase = import("./app/models/game-database").GameDatabase;
declare type ModProfileRef = import("./app/models/mod-profile-ref").ModProfileRef;
declare type ModDeploymentMetadata = import("./app/models/mod-deployment-metadata").ModDeploymentMetadata;
declare type FomodModuleInfo = import("./app/models/fomod").Fomod.ModuleInfo;
declare type FomodModuleConfig = import("./app/models/fomod").Fomod.ModuleConfig;
