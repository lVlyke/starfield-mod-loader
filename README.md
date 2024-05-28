# Starfield Mod Loader

A simple mod manager for Starfield and Fallout 4 that supports both Steam and UWP (Game Pass) versions of the games.

![Starfield Mod Loader](/docs/app.png)

# Features

* Support for **Steam** and **UWP (Game Pass)** versions of games
* **Add**, **re-order**, **rename**, **disable** and **remove** your mods and plugins
* **Multiple profiles** enable quick switching between different games and mod loadouts
* **Root mod** support enables management of ENBs, script extenders, and other injectors
* Support for FOMOD installers
* Native Linux version (including Steam Deck)

# Releases

Releases can be found here:

&nbsp;&nbsp;&nbsp;&nbsp;[Starfield Mod Loader releases](https://github.com/lVlyke/starfield-mod-loader/releases)

# Supported Games
Starfield Mod Loader supports the following games:

* **Starfield**
* **Fallout 4**

# Installation

To install Starfield Mod Loader, simply download the latest release from the [releases page](https://github.com/lVlyke/starfield-mod-loader/releases) and extract the archive to a folder of your choice.

**Note:** [7-Zip](https://www.7-zip.org/) is required to be installed in order to add mods that use RAR archives.

To enable mods in Starfield, add the following lines to the `StarfieldCustom.ini` file in your `Documents/My Games/Starfield` folder if not already present:

```ini
[Archive]
bInvalidateOlderFiles=1
sResourceDataDirsFinal=
```

# Using Starfield Mod Loader

**Note:** This guide refers specifically to Starfield, but most of the information also applies to other games.

## Create a profile

To add and manage mods you must first create a profile. Upon first launching the app you will be shown a form to create a new profile.

The **Mod Base Directory** path should be set to the `Data` folder in either your `Documents/My Games/Starfield` folder or the game's installation folder (required for SFSE mods).

**Note:** If you are using the game's installation `Data` folder, make sure you delete the `Data` folder at `Documents/My Games/Starfield`, otherwise your mods will not be detected by the game.

The **Game Base Directory** path should be set to the game's installation directory. By default this will be `C:\Program Files (x86)\Steam\steamapps\common\Starfield` for Steam or `C:\XboxGames\Starfield\Content` for UWP/Game Pass, but this may vary depending on where you chose to install the game.

The **Game Executable** path should point to `Starfield.exe` (or `sfse_loader.exe` if using SFSE), which should be in the game base directory from the prior step. **Note:** You may get an error from Windows Explorer when selecting the UWP version of `Starfield.exe` that says "You don't have permission to open this file". If this happens, simply copy the path of the file and manually paste it into the input field without using the file explorer.

You can create additional profiles at any time by pressing the **Create Profile** button above the **Mod List** section or by selecting **Profile > Add New Profile** from the the menu bar.

## Add some mods

Once your profile is set up you can begin adding and managing mods. To add a new mod, click the **+** icon in the **Mod List** section and select **Add Mod**, or select **Profile > Mods > Add Mod** from the menu bar and choose the mod that you want to install.

**Note:** You can also import existing mods by clicking the **+** icon in the **Mod List** section and select **Import Mod**, or select **Profile > Mods > Import Mod** from the menu bar. This will allow you to add a mod from a folder, which can be useful for importing mods from other profiles.

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

Any mod files that you have manually copied to your **Mod Base Directory** outside of the app will show up in the UI as **Manually installed mods**. These mods cannot be managed by Starfield Mod Loader and will not be removed or overwritten. This means that **any manually copied mods in your Mod Base Directory folder will override the mods in Starfield Mod Loader.**

**Tip:** You can change the app theme under **File > Preferences**.

### ESP/ESM plugins

Once at least one mod with a plugin has been installed, you will see your plugins listed along with their load order. Plugins can be individually disabled or re-ordered by dragging and dropping them.

Plugin support can be enable or disabled by going to **File > Preferences** and toggling the plugin support option. If disabled, you will be prompted to enable plugins when adding mods that include plugins.

**IMPORTANT NOTE FOR STARFIELD:** Starfield does not yet officially support plugins. To use unofficial plugins for Starfield, you will also need to install the **[Plugins.txt Enabler mod](https://www.nexusmods.com/starfield/mods/4157)** for plugins to load correctly.

## Activate your mods

To enable mods in the game you must first activate them. Press the **Activate Mods** button in the **Actions** section and your mods will be deployed to the **Mod Base Directory**.

Mods will now remain active until you press the **Deactivate Mods** button, even if you close the app or restart your PC.

**IMPORTANT NOTE:** If you update any of the profile's mod files externally (i.e. in a text editor) while mods are deployed, make sure to press the **Refresh Files** button after, otherwise your changes will not be applied.

**Tip (Linux):** It is recommended to enable the **Normalize path case** option under **File > Preferences** when using Linux with a case-sensitive file system. See [here](#normalizePathCase) for more info.

## Launch the game

Click the **Start Game** button or launch the game directly from Steam or Game Pass. Your mods should now be active!

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

Some mods may use different casing for their files/folders (i.e. `Interface` vs `interface`) and this can cause issues on case-sensitive file systems, which are often used on Linux. To prevent this issue, you can enable the **Normalize path case** option under **File > Preferences**. When this setting is enabled, Starfield Mod Loader will automatically convert all activated mod files and folders to lowercase.

### **(Linux)** Mods are not loading when using SFSE

When running SFSE via Proton, Steam will create a new virtual C drive for SFSE that's different from the virtual C drive used for Starfield. This means that when running SFSE, your `StarfieldCustom.ini` and `StarfieldPrefs.ini` files will not be loaded, and instead new ones will be created on the new virtual C drive.

To avoid having two separate copies of these files, the easiest solution is to create a symlink on the new virtual C drive to the `Documents/My Games/Starfield` directory on the original Starfield virtual C drive. This way, both virtual C drives will point to the same `Documents/My Games/Starfield` directory.

You will first need to figure out the new virtual C drive directory for SFSE, which will be located in `~/.local/share/Steam/steamapps/compatdata`. You will see a number of directories in here with numerical IDs. One of these directories corresponds to the game ID that Steam assigned to SFSE. To determine which game ID is the correct one, you can look at the folder's "Date modified" timestamp to figure out which virtual drive directories were created recently. Assuming you added SFSE recently, it should have a Date modified field that matches when SFSE was added.

Once you have figured out the game ID for SFSE, navigate to `<game_id>/pfx/drive_c/users/steamuser/Documents/My Games`. Delete the existing `Starfield` directory inside of this directory and then open a terminal at this directory and run the following command:

```sh
# Starfield's game ID is 1716740
ln -s "~/.local/share/Steam/steamapps/compatdata/1716740/pfx/drive_c/users/steamuser/Documents/My Games/Starfield" "./Starfield"
```

This will create a symlink to Starfield's `Documents/My Games/Starfield` directory, ensuring that SFSE is using the same ini files as the base game.

## Report an issue

If you run into a problem, please check the [issues page](https://github.com/lVlyke/starfield-mod-loader/issues) to see if your question has been answered or create a new issue if you have a bug to report.

# Devs - Building and testing

To build and run the app for testing and development, ensure you have Node and NPM installed on your machine and run `npm install` and `npm run start`.