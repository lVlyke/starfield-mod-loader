# Starfield Mod Loader

A cross-platform mod manager for Starfield and other games.

![Starfield Mod Loader](/docs/app.png)

# Features

* **Add**, **re-order**, **rename**, **disable** and **remove** your mods and plugins
* **Multiple profiles** enable quick switching between different games and mod loadouts
* **Root mod** support enables management of ENBs, script extenders, and other injectors
* **Cross-platform**: Native clients for Windows and Linux (including Steam Deck)
* Support for **Steam**, **UWP (Game Pass)** and other versions of games
* Per-profile config files and archive invalidation
* Support for FOMOD installers

# Releases

Releases can be found here:

&nbsp;&nbsp;&nbsp;&nbsp;[Starfield Mod Loader releases](https://github.com/lVlyke/starfield-mod-loader/releases)

# Supported Games
Starfield Mod Loader currently supports the following games:

* **Starfield**
* **Fallout 4**
* **Fallout: New Vegas**

# Installation

To install Starfield Mod Loader, simply download the latest release from the [releases page](https://github.com/lVlyke/starfield-mod-loader/releases) and extract the archive to a folder of your choice.

**Note:** [7-Zip](https://www.7-zip.org/) is required to be installed in order to add mods that use RAR archives.

# Using Starfield Mod Loader

> **Quick Links:**
> * **Profiles**
>   * [**Create a profile**](#create-a-profile)
>   * [**Config file management**](#configini-file-management)
>   * [**Link mode**](#link-mode)
>   * [**Archive invalidation**](#archive-invalidation)
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
> * [**Launching games**](#launch-the-game)
> * [**Troubleshooting**](#troubleshooting)

**Note:** This guide refers specifically to Starfield, but most of the information also applies to other games.

To enable mods in Starfield, add the following lines to the `StarfieldCustom.ini` file in your `Documents/My Games/Starfield` folder if not already present:

```ini
[Archive]
bInvalidateOlderFiles=1
sResourceDataDirsFinal=
```

## Create a profile

To add and manage mods you must first create a profile. Upon first launching the app you will be shown a form to create a new profile.

The **Mod Base Directory** path should be set to the `Data` folder in either your `Documents/My Games/Starfield` folder or the game's installation folder (required for SFSE mods).

**Note:** If you are using the game's `Data` folder, make sure you rename or delete `Documents/My Games/Starfield/Data` if it exists, otherwise your mods will not be detected by the game.

The **Game Base Directory** path should be set to the game's installation directory. By default this will be `C:\Program Files (x86)\Steam\steamapps\common\Starfield` for Steam or `C:\XboxGames\Starfield\Content` for UWP/Game Pass, but this may vary depending on where you chose to install the game.

The **Game Executable** path should point to `Starfield.exe` (or `sfse_loader.exe` if using SFSE), which should be in the game base directory from the prior step. **Note:** You may get an error from Windows Explorer when selecting the UWP version of `Starfield.exe` that says "You don't have permission to open this file". If this happens, simply copy the path of the file and manually paste it into the input field without using the file explorer.

The **Plugin List Path** is the location of the `plugins.txt` file for the game. For Starfield, this is located at `<User_Directory>/AppData/Local/Starfield/plugins.txt`.

### Config/INI file management

If the **Manage Config/INI Files** option is enabled, new config files will be created for the profile. When enabled, you must also define the **Config Files Directory**. For Starfield, this is located at `<User_Directory>/Documents/My Games/Starfield` by default, but may be different depending on your OS settings.

Upon first enabling the option you will be prompted to copy the existing config files from the **Config Files Directory** to the profile's config files.

**NOTE:** When activating mods, the profile's config files will be copied to the **Config Files Directory**. If any existing config files are in the **Config Files Directory** when mods are activated, they will be moved to a `.sml.bak` folder during activation. The files moved to `.sml.bak` will be restored back to their original location upon deactivating mods.

### Link mode

When **Link Mode** is enabled, "links" to the mod files will be used instead of copying the files when activating mods. This is significantly faster and uses less disk space. This setting is recommended to be enabled when possible.

**NOTE:** This setting can only be enabled if Starfield Mod Loader is located on the same disk/partition as the game itself.

### Archive invalidation

Certain games require a feature called **Archive Invalidation** to properly load mod files. If this setting is enabled, Starfield Mod Loader will automatically enable archive invalidation to ensure all mods are loaded properly.

**NOTE:** It is recommended to also enable the "Manage Config/INI Files" option. However if it is disabled, and existing config files can be located, archive invalidation can still be enabled.

### Creating additional profiles

You can create additional profiles at any time by pressing the **Create Profile** button above the **Mod List** section or by selecting **Profile > Add New Profile** from the the menu bar.

**Tip:** You can change the app theme at any time under **File > Preferences**.

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

Mods you have added will appear in your mods list with the load order of that mod shown to the right of its name. You can modify the load order of a mod by dragging and dropping it in the list. Unchecking a mod will disable it and make it inactive. To rename or delete a mod, right click it and select the appropriate option.

You can customize which columns of the mods list are visible under the **View > Mod List Columns** section of the app menu bar.

### External files

Existing game files and other files that have been manually copied to the **Mod Base Directory** outside of your profile will show up in the UI as **External files**. When activating mods for a profile that overwrite external files, the original external files will be moved to a folder called `.sml.bak` while mods are activated. The files in the `.sml.bak` folder will be restored back to their original location upon deactivating mods.

## Game plugins

Once at least one mod with a plugin has been installed, you will see your plugins listed along with their load order. Plugins can be individually disabled or re-ordered by dragging and dropping them. You can right click individual plugins to bring up additional options.

### Plugin type promotion

Most games have rules regarding the load order of different types of plugins. For Starfield and other Bethesda games, the order is `ESM -> ESL -> ESP`. However, mods sometimes contain `ESP` plugins that are "flagged" as `ESM` or `ESL`. While Starfield Mod Loader does not currently parse these flags, you can manually account for this by using **plugin type promotion**. To promote a plugin to a new type, right-click it and use the "Plugin Type" option to select the new plugin type. Once promoted, the plugin will behave as if it were of the promoted type.

### External plugins

External game plugin management is optional for some games and is required for others. For games where external plugin management is optional, it can be enabled or disabled by pressing the "Manage External Plugins" button at the top left of the plugins list. When enabled, all external game plugin files will be shown in the list and can be re-ordered alongside profile-managed plugins.

### Backup/restore plugin order

You can backup and restore the plugin load order using the buttons at the top right of the plugins list. Pressing the "Restore Plugin Backup" button will show a list of all available plugin order backups that can be restored. You can also export the plugin order in a plugins.txt-compatible format using the "Export Plugins List" button.

## Config file management

If you enabled the **Manage Config/INI Files** option for your profile, you will be able to select the "Config" option from the dropdown at the top of the Plugins list. From this section you can edit your profile-specific config/INI files.

## Activate your mods

To enable mods in the game you must first activate them. Press the **Activate Mods** button in the **Actions** section and your mods will be deployed to the **Mod Base Directory**.

Mods will now remain active until you press the **Deactivate Mods** button, even if you close the app or restart your PC.

**IMPORTANT NOTE:** If Link Mode is disabled for the profile and you update any of the profile's mod files externally (i.e. in a text editor) while mods are deployed, make sure to press the **Refresh Files** button after, otherwise your changes will not be applied.

**Tip (Linux):** It is recommended to enable the **Normalize path case** option under **File > Preferences** when using Linux with a case-sensitive file system. See [here](#normalizePathCase) for more info.

## Launch the game

You can either click the **Start Game** button or simply launch the game directly through Steam, Game Pass, etc. Your mods should now be active!

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

### **(Linux)** Some mods are not loading/strange behavior when loading some mods <a name="normalizePathCase"></a>

Some mods may use different casing for their files/folders (i.e. `Interface` vs `interface`) and this can cause issues on case-sensitive file systems, which are often used on Linux. To prevent this issue, you can enable the **Normalize path case** option under **File > Preferences**. When this setting is enabled, Starfield Mod Loader will automatically convert all activated mod files and folders to lowercase when appropriate.

### **(Linux)** Mods are not loading when using SFSE

When running SFSE via Steam/Proton, Steam will create a new virtual C drive for SFSE that's different from the virtual C drive used for Starfield. This means that when running SFSE, your `StarfieldCustom.ini` and `StarfieldPrefs.ini` files will not be loaded, and instead new ones will be created on the new virtual C drive.

To avoid having two separate copies of these files, the easiest solution is to create a symlink on the new virtual C drive to the `Documents/My Games/Starfield` directory on the original Starfield virtual C drive. This way, both virtual C drives will point to the same `Documents/My Games/Starfield` directory.

You will first need to figure out the new virtual C drive directory for SFSE, which will be located in `~/.local/share/Steam/steamapps/compatdata`. You will see a number of directories in here with numerical IDs. One of these directories corresponds to the game ID that Steam assigned to SFSE. To determine which game ID is the correct one, you can look at the folder's "Date modified" timestamp to figure out which virtual drive directories were created recently. Assuming you added SFSE recently, it should have a Date modified field that matches when SFSE was added.

Once you have figured out the game ID for SFSE, navigate to `<sfse_game_id>/pfx/drive_c/users/steamuser/Documents/My Games`. Delete the existing `Starfield` directory inside of this directory and then open a terminal at this directory and run the following command:

```sh
# Starfield's game ID is 1716740
ln -s "~/.local/share/Steam/steamapps/compatdata/1716740/pfx/drive_c/users/steamuser/Documents/My Games/Starfield" "./Starfield"
```

This will create a symlink to Starfield's `Documents/My Games/Starfield` directory, ensuring that SFSE is using the same ini files as the base game.

You must also create a symlink in `<sfse_game_id>/pfx/drive_c/users/steamuser/AppData/Local`:

```sh
# Create a symlink to `/AppData/Local/Starfield`
ln -s "~/.local/share/Steam/steamapps/compatdata/1716740/pfx/drive_c/users/steamuser/AppData/Local/Starfield" "./Starfield"
```

## Report an issue

If you run into a problem, please check the [issues page](https://github.com/lVlyke/starfield-mod-loader/issues) to see if your question has been answered or create a new issue if you have a bug to report.

# Devs - Building and testing

To build and run the app for testing and development, ensure you have Node and NPM installed on your machine and run `npm install` and `npm run start`.