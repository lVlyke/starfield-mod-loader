# Starfield Mod Loader

A cross-platform mod manager for Starfield and other games.

![Starfield Mod Loader](/docs/app1.png)

# Features

* **Add**, **re-order**, **rename**, **disable** and **remove** your mods and plugins
* **Multiple profiles** enable quick switching between different games and mod loadouts
* **Base profiles** allow for creating a base set of mods that can be dynamically extended by other profiles
* **Root mod** support enables management of ENBs, script extenders, and other injectors
* **Cross-platform**: Native clients for Windows and Linux (including Steam Deck)
* Per-profile management of config files, save files, and archive invalidation
* Support for FOMOD installers
* Support for **Steam**, **UWP (Game Pass)** and other versions of games

# Releases

Releases can be found here:

&nbsp;&nbsp;&nbsp;&nbsp;[Starfield Mod Loader releases](https://github.com/lVlyke/starfield-mod-loader/releases)

# Supported Games
Starfield Mod Loader currently supports the following games:

* **Elder Scrolls IV: Oblivion**
* **Fallout 4**
* **Fallout: New Vegas**
* **Starfield**

# Installation

To install Starfield Mod Loader, simply download the latest release from the [releases page](https://github.com/lVlyke/starfield-mod-loader/releases) and extract the archive to a folder of your choice.

**Note:** [7-Zip](https://www.7-zip.org/) is required to be installed in order to add mods that use RAR archives.

# Using Starfield Mod Loader

> **Quick Links:**
> * **Profiles**
>   * [**Create a profile**](#create-a-profile)
>   * [**Config file management**](#configini-file-management)
>   * [**Save file management**](#save-file-management)
>   * [**Link mode**](#link-mode)
>   * [**Archive invalidation**](#archive-invalidation)
>   * [**Base profile**](#base-profile)
>   * [**Profile path overrides**](#profile-path-overrides)
>   * [**Steam compat symlinks (Linux)**](#linux-steam-compat-symlinks)
> * [**Base profiles**](#base-profiles)
> * **Mods**
>   * [**Adding mods**](#add-some-mods)
>   * [**FOMOD installers**](#fomod-installers)
>   * [**Root mods**](#root-mods)
>   * [**Managing mods**](#managing-your-mods)
>   * [**Activating mods**](#activate-your-mods)
>     * [**Path case normalization (Linux)**](#normalizePathCase)
> * **Plugins**
>   * [**Managing plugins**](#game-plugins)
>   * [**Plugin type promotion**](#plugin-type-promotion)
>   * [**External plugin files**](#external-plugins)
>   * [**Backup/restore load order**](#backuprestore-plugin-order)
> * [**Config file management**](#config-file-management)
> * [**App settings**](#app-settings)
>   * [**Mod file path case normalization (Linux)**](#normalize-mod-file-path)
> * [**Launching games**](#launch-the-game)
>   * [**Custom actions**](#custom-actions)
> * [**Troubleshooting**](#troubleshooting)

**Note:** This guide refers specifically to Starfield in some places, but most of the information also applies to other games.

To enable mods in Starfield, add the following lines to the `StarfieldCustom.ini` file in your `Documents/My Games/Starfield` folder if not already present:

```ini
[Archive]
bInvalidateOlderFiles=1
sResourceDataDirsFinal=
```

## Create a profile

To add and manage mods you must first create a profile. Upon first launching the app you will be shown a form to create a new profile.

The **Game Root Directory** path should be set to the game's installation directory. By default this will be `C:\Program Files (x86)\Steam\steamapps\common\Starfield` for Steam or `C:\XboxGames\Starfield\Content` for UWP/Game Pass, but this may vary depending on where you chose to install the game.

The **Game Data Directory** path should be set to the `Data` folder in either your `Documents/My Games/Starfield` folder or the game's installation folder (required for SFSE mods).

**Note:** If you are using the game's `Data` folder, make sure you rename or delete `Documents/My Games/Starfield/Data` if it exists, otherwise your mods will not be detected by the game.

The **Game Executable** path should point to `Starfield.exe` (or `sfse_loader.exe` if using SFSE), which should be in the game base directory from the prior step. **Note:** You may get an error from Windows Explorer when selecting the UWP version of `Starfield.exe` that says "You don't have permission to open this file". If this happens, simply copy the path of the file and manually paste it into the input field without using the file explorer.

The **Game Plugin List Path** is the location of the `plugins.txt` file for the game. For Starfield, this is located at `<User_Directory>/AppData/Local/Starfield/plugins.txt`.

### Config/INI file management

If the **Manage Config/INI Files** option is enabled, new config files will be created for the profile. When enabled, you must also define the **Game Config Files Directory**. For Starfield, this is located at `<User_Directory>/Documents/My Games/Starfield` by default, but may be different depending on your OS settings.

Upon first enabling the option you will be prompted to copy the existing config files from the **Game Config Files Directory** to the profile's config files.

**NOTE:** When activating mods, the profile's config files will be copied to the **Game Config Files Directory**. If any existing config files are in the **Game Config Files Directory** when mods are activated, they will be moved to a `.sml.bak` folder during activation. The files moved to `.sml.bak` will be restored back to their original location upon deactivating mods.

### Save file management

If the **Manage Save Files** option is enabled, any created save games while this profile is deployed will be tied only to that profile. When enabled, you must also define the **Game Saves Directory**. For Starfield, this is located at `<User_Directory>/Documents/My Games/Starfield/Saves` by default, but may be different depending on your OS settings.

### Link mode

When **Link Mode** is enabled, file links to the mod files will be used instead of copying the files when activating mods. This is significantly faster and uses less disk space. This setting is recommended to be enabled when possible.

Link mode can also be separately enabled for config files and save files. To enable/disable link mode for config or save files, click the icon to the left of **Game Config Files Directory** or **Game Saves Directory**.

**NOTE:** Link mode can only be enabled if the profile is located on the same disk/partition as the game itself.

### Archive invalidation

Certain games require a feature called **Archive Invalidation** to properly load mod files. If this setting is enabled, Starfield Mod Loader will automatically enable archive invalidation to ensure all mods are loaded properly.

**NOTE:** It is recommended to also enable the "Manage Config/INI Files" option. However if it is disabled, and existing config files can be located, archive invalidation can still be enabled.

### Base profile

You can optionally pick a base profile to inherit from. By default only base profiles from the current game are shown, but you can select any base profile by checkng **Show all profiles**.

See [this section](#base-profiles) for more information about base profiles.

### Profile path overrides

You can choose to override any of the profile paths to point to other directories. Each profile path override will be explained below.

#### Profile Root Path

By default, profiles are stored in the `profiles` directory of Starfield Mod Loader. Overriding this path will allow you to store the profile at an alternative location. This can be useful if your game is installed on a different drive and you want to co-locate the profile to the same drive as the game to enable Link mode.

A profile with an overridden root path is called an **external profile**. Existing external profiles can also be added or imported by selecting **Profiles -> Add External Profile** or **Profiles -> Import Profile**.

#### Profile mods path

Overriding this path will allow you to store the profile's mods at an alternative location.

#### Profile saves path

Overriding this path will allow you to store the profile's save files at an alternative location. This is useful if you are syncing save files between multiple PCs or profiles.

#### Profile config path

Overriding this path will allow you to store the profile's config files at an alternative location. This is useful if you are syncing config files between multiple PCs or profiles.

#### Profile backups path

Overriding this path will allow you to store the profile's backup files at an alternative location.

### (Linux) Steam Compat Symlinks

When running a script extender such as SFSE via Steam/Proton, Steam will automatically create a new virtual C drive for it that is different from the virtual C drive used for the game itself. This means that when you go to launch the script extender, your config/INI and save files will not be loaded, and instead new ones will be created on the new virtual C drive.

To avoid having two separate copies of these files, symlinks can be created on the virtual C drive for the script extender that point to the correct directory on the original game's virtual C drive. This allows both virtual C drives to use the same directory for reading config and save files.

Starfield Mod Loader can automate this behavior by enabling **Manage Steam Compat Symlinks** for the profile.

You will first need to figure out the new virtual C drive directory for the script extender, which will normally be located in `~/.local/share/Steam/steamapps/compatdata`. You will see a number of directories in here with numerical IDs. One of these directories corresponds to the game ID that Steam assigned to the script extender. To determine which game ID is the correct one, you can look at the folder's "Date modified" timestamp to figure out which virtual drive directories were created recently. Assuming you added the script extender to Steam recently, the directory should have a Date modified field that matches when it was added to Steam.

Once you have found the custom game ID, enter it as the **Custom Steam Game ID** for the profile. The necessary symlinks will now be created automatically when the profile is deployed.

### Creating additional profiles

You can create additional profiles at any time by pressing the **Create Profile** button above the **Mod List** section or by selecting **Profile > Add New Profile** from the the menu bar.

**Tip:** You can change the app theme at any time under **File > Preferences**.

## Base profiles

Base profiles are a special kind of profile that can be extended by other profiles. Mods and plugins in a base profile are added and managed as normal, but cannot directly be deployed. Instead, other profiles can extend a base profile and will automatically inherit mods, plugins, and config files from the base profile.

This allows for defining a common set of mods that can be used and extended by other profiles. One way this can be useful is for easily deploying a common set of mods between multiple PCs while also allowing for adding mods or config settings that may only be used on certain machines, such as high-res texture packs or specific compatability patches only needed for some devices.

Game directories are not defined for base profiles, allowing extending profiles to point to different game installation locations as needed.

## Add some mods

Once your profile is set up you can begin adding and managing mods. To add a new mod, click the **+** icon in the **Mod List** section and select **Add Mod**, or select **Profile > Mods > Add Mod** from the menu bar and choose the mod that you want to install.

**Note:** You can also import existing mods by clicking the **+** icon in the **Mod List** section and select **Import Mod**, or select **Profile > Mods > Import Mod** from the menu bar. This will allow you to add a mod from a folder, which can be useful for importing mods from other profiles or sources.

**Tip:** You can also add mods by dragging and dropping them into the app. This will allow you to install multiple mods at a time.

After choosing a mod to add you will be shown either a [FOMOD installer](#fomod-installers), or the default installation options.

### Default mod installation

The default installation allows you to rename the mod and select which files from the mod to add. By default, all files from the mod will be added. However, some mods may occasionally contain a non-standard directory structure that can require changing the **root data dir**, like in the following example:

![Add Mod Example 1](/docs/mod-add-1.png)

This mod contains a single root directory called `standard` that contains an inner `Data` directory with all of the mod files. We need to mark this inner `Data` directory as the **root data dir** in order for the mod to be installed correctly:

![Add Mod Example 2](/docs/mod-add-2.png)

Now, only the files in `standard/Data` directory will be added for this mod.

### FOMOD installers

Some mods are packaged with special metadata known as FOMOD that allows for customizing the installation through a guided flow. Starfield Mod Loader supports FOMOD and will automatically show the installation wizard for FOMOD-compatible mods, as shown in the example below:

![FOMOD Installer Example 1](/docs/fomod-1.png)

The installer will guide you through the installation of the mod. Hovering over or selecting an option will show information about what it does. If you wish to install the mod manually instead, you can click the **Manual Install** button at the bottom left corner of the installer window.

**Note**: Many mods will ask you if you are using Vortex or Mod Organizer 2. Starfield Mod Loader supports either option, but if you encounter any issues, select **Mod Organizer 2**.

**Tip**: Click the preview image (or the **?** tooltip in compact view) to show a fullscreen view of the image.

### Root mods

Root mods are mods that are deployed to the **Game Base Directory** instead of the **Mod Base Directory**. This allows for script extenders, DLSS injectors, ENBs, and other types of injectors to be managed as mods in your profile.

To add a root mod, click the **+** icon in the **Mod List** section and select **Add Root Mod**, or select **Profile > Mods > Add Root Mod** from the menu bar and chose the mod that you want to install.

## Managing your mods

Mods you have added will appear in your mods list with the load order of that mod shown to the right of its name. You can modify the load order of a mod by dragging and dropping it in the list. Unchecking a mod will disable it and make it inactive. Mods inherited from a base profile cannot be re-ordered or enabled/disabled.

You can right click individual mods to bring up additional options, such as renaming or deleting.

**Tip:** You can customize which columns of the mods list are visible under the **View > Mod List Columns** section of the app menu bar.

### External files

Existing game files and other files that have been manually copied to the **Mod Base Directory** outside of your profile will show up in the UI as **External files**. When activating mods for a profile that overwrite external files, the original external files will be moved to a folder called `.sml.bak` while mods are activated. The files in the `.sml.bak` folder will be restored back to their original location upon deactivating mods.

## Game plugins

Once at least one mod with a plugin has been installed, you will see your plugins listed along with their load order. Plugins can be individually disabled or re-ordered by dragging and dropping them. Plugins inherited from a base profile cannot be re-ordered or enabled/disabled.

You can right click individual plugins to bring up additional options.

### Plugin type promotion

Most games have rules regarding the load order of different types of plugins. For Starfield and other Bethesda games, the order is `ESM -> ESL -> ESP`. However, mods sometimes contain `ESP` plugins that are "flagged" as `ESM` or `ESL`. While Starfield Mod Loader does not currently parse these flags, you can manually account for this by using **plugin type promotion**. To promote a plugin to a new type, right-click it and use the "Plugin Type" option to select the new plugin type. Once promoted, the plugin will behave as if it were of the promoted type.

### External plugins

External game plugin management is optional for some games and is required for others. For games where external plugin management is optional, it can be enabled or disabled by pressing the "Manage External Plugins" button at the top left of the plugins list. When enabled, all external game plugin files will be shown in the list and can be re-ordered alongside profile-managed plugins.

### Backup/restore plugin order

You can backup and restore the plugin load order using the buttons at the top right of the plugins list. Pressing the "Restore Plugin Backup" button will show a list of all available plugin order backups that can be restored. You can also export the plugin order in a plugins.txt-compatible format using the "Export Plugins List" button.

## Config file management

If you enabled the **Manage Config/INI Files** option for your profile, you will be able to select the "Config" option from the dropdown at the top of the Plugins list. From this section you can edit your profile-specific config/INI files.

If profile-managed config/INI files are disabled, you will see an option in the "Actions" section to view external config files if any are found.

## Activate your mods

To enable mods in the game you must first deploy the profile. Press the **Activate Mods** button in the **Actions** section to deploy the current profile.

Mods will now remain active until you press the **Deactivate Mods** button, even if you close the app or restart your PC.

**IMPORTANT NOTE:** If Link Mode is disabled for the profile and you update any of the profile's mod files externally (i.e. in a text editor) while mods are deployed, make sure to press the **Refresh Files** button after, otherwise your changes will not be applied.

## App settings

App settings can be changed via **File > Preferences** from the menu bar. The following settings are available:

### Normalize mod file path

Some mods may use different casing for their files/folders (i.e. `Interface` vs `interface`) and this can cause issues on case-sensitive file systems, which are often used on Linux. When this setting is enabled, Starfield Mod Loader will automatically convert all activated mod files and folders to the correct case to avoid this issue.

It is recommended to enable the **Normalize mod file path** setting when using Linux with a case-sensitive file system.

### Verify active profile on app startup

Whether or not the active profile should be verified upon starting Starfield Mod Loader. This is recommended to be enabled, but can be disabled if verification takes too long.

### Enable game plugins

Whether or not plugin management is enabled. Only disable this if you do not want plugins to be managed.

### (Linux) Steam compat data root

The path to Steam's compatdata directory. By default this is located at `~/.local/share/Steam/steamapps/compatdata`, but if it is located at a different location you can define it here. See [this section](#linux-steam-compat-symlinks) for more information.

### App theme

The app theme to use.

## Launch the game

You can either click the **Start Game** button or simply launch the game directly through Steam, Game Pass, etc. The game should launch with your mods enabled!

### Custom actions

Additional actions can be added by clicking the dropdown arrow to the right of the **Start Game** button and clicking **New Action**. Set the **Name** for your action and the **Action** to perform. **Action** can be a program or script along with any needed options. You can now select this action by clicking the dropdown arrow.

# Troubleshooting

## Common issues

### My mods are not loading

First, make sure you have added the following lines to your `StarfieldCustom.ini` file:

```ini
[Archive]
bInvalidateOlderFiles=1
sResourceDataDirsFinal=
```

If mods still are not working, you may also need to also add these lines to your `StarfieldPrefs.ini` file.

If you are using the game's installation `Data` folder as your **Mod Base Directory**, make sure you delete the `Data` folder at `Documents/My Games/Starfield`, otherwise your mods will not be detected by the game. The game will automatically create this folder on game start and when you take in-game screenshots. To change this behavior, you can add the following lines to your `StarfieldCustom.ini` and `StarfieldPrefs.ini` files to disable MotD and change your screenshots folder:

```ini
[General]
bEnableMessageOfTheDay=0
```

```ini
[Display]
sPhotoModeFolder=Photos
```

### Symlinks are not enabled <a name="symlinks"></a>

If you get a warning about symlinks not being enabled when creating or editing a profile, you need to enable symlink permissions.

To enable symlinks in Windows, you can either A) enable Windows Developer Mode by going the Windows "Settings" app, select "For developers", and then enable "Developer Mode", or B) run Starfield Mod Loader as administrator (not recommended). Once enabled, Starfield Mod Loader should now be able to use symlinks.

### The app sits on the "Verifying Profile..." loading screen for a long time during startup

This can happen when very large profiles are activated. If profile verification is taking too long, you can disable verification on app startup via the menu bar under **File > Preferences**.

### **(Linux)** Some mods are not loading/strange behavior when loading some mods

This can be fixed by enabling **Normalize mod file path** for the app. See [this section](#normalize-mod-file-path) for more information.

### **(Linux)** Mods are not loading when using a script extender like SFSE

This can be fixed by enabling **Manage Steam Compat Symlinks** for the profile. See [this section](#linux-steam-compat-symlinks) for more information.

## Report an issue

If you run into a problem, please check the [issues page](https://github.com/lVlyke/starfield-mod-loader/issues) to see if your question has been answered or create a new issue if you have a bug to report.

# Devs - Building and testing

To build and run the app for testing and development, ensure you have Node and NPM installed on your machine and run `npm install` and `npm run start`.

To build a release, run `npm run app:build-release` for the current platform or `npm run app:build-release:all` for all supported platforms.