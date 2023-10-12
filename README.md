# Starfield Mod Loader

A simple mod manager for Starfield that supports both Steam and UWP (Game Pass) versions of the game.

![Starfield Mod Loader](/docs/app.png)

## Features

* Support for **Steam** and **UWP (Game Pass)** versions of Starfield
* **Add**, **re-order**, **rename**, **disable** and **remove** your mods
* **Multiple profiles** enable quick switching between different mod loadouts
* Support for ESP/ESM plugins __**[*](#espesm-plugins)**__
* Native Linux version (including Steam Deck)

# Releases

Releases can be found here:

&nbsp;&nbsp;&nbsp;&nbsp;[Starfield Mod Loader releases](https://github.com/lVlyke/starfield-mod-loader/releases)

# Installation

To install Starfield Mod Loader, simply download the latest release from the [releases page](https://github.com/lVlyke/starfield-mod-loader/releases) and extract the archive to a folder of your choice.

To enable mods in Starfield, add the following lines to the `StarfieldCustom.ini` file in your `Documents/My Games/Starfield` folder if not already present:

```ini
[Archive]
bInvalidateOlderFiles=1
sResourceDataDirsFinal=
```

# Using Starfield Mod Loader

## Create a profile

To add and manage mods you must first create a profile. Upon first launching the app you will be shown a form to create a new profile.

The **Mod Base Directory** path should be set to the `Data` folder in either your `Documents/My Games/Starfield` folder or the game's installation folder (required for SFSE mods).

**Note:** If you are using the game's installation `Data` folder, make sure you delete the `Data` folder at `Documents/My Games/Starfield`, otherwise your mods will not be detected by the game.

The **Game Base Directory** path should be set to the game's installation directory. By default this will be `C:\Program Files (x86)\Steam\steamapps\common\Starfield` for Steam or `C:\XboxGames\Starfield\Content` for UWP/Game Pass, but this may vary depending on where you chose to install Starfield.

The **Game Executable** path should point to `Starfield.exe` (or `sfse_loader.exe` if using SFSE), which should be in the game base directory from the prior step. **Note:** You may get an error from Windows Explorer when selecting the UWP version of `Starfield.exe` that says "You don't have permission to open this file". If this happens, simply copy the path of the file and manually paste it into the input field without using the file explorer.

You can create additional profiles at any time by pressing the **Create Profile** button above the **Mod List** section or by selecting **Profile > Add New Profile** from the the menu bar.

## Add some mods

Once your profile is set up you can begin adding and managing mods. To add a new mod, click the **+** icon in the **Mod List** section and select **Add Mod**, or select **Profile > Mods > Add Mod** from the menu bar. Choose the mod you want to install.

**Tip:** You can also add mods by dragging and dropping them into the app. This will allow you to install multiple mods at a time.

Upon choosing a mod to add, you will be shown a form with options to rename the mod and select which files from the mod to add. By default, all files will be added. However some mods, such as those in the FOMOD format, may have a directory structure with multiple install options like in the example below:

![Add Mod Example 1](/docs/mod-add-1.png)

In this example, each subdirectory represents a different option of installation for the mod. To choose one of these install options, we need to pick one and manually mark its `Data` directory the **root data dir**:

![Add Mod Example 2](/docs/mod-add-2.png)

Now, only the files in `120 FPS/Data` directory will be added for this mod.

The mod you have added will appear in your mods list with the load order of that mod shown to the right of its name. You can modify the load order of a mod by dragging and dropping it in the list. Unchecking a mod will disable it and make it inactive. To rename or delete a mod, right click it and select the appropriate option.

**Tip**: You can also import existing mods by clicking the **+** icon in the **Mod List** section and select **Import Mod**, or select **Profile > Mods > Import Mod** from the menu bar. This will allow you to add a mod from a folder, which can be useful for importing mods from other profiles.

Any mod files that you have manually copied to your **Mod Base Directory** outside of the app will show up in the UI as **Manually installed mods**. These mods cannot be managed by Starfield Mod Loader and will not be removed or overwritten. This means that **any manually copied mods in your Mod Base Directory folder will override the mods in Starfield Mod Loader.**

### ESP/ESM plugins

**IMPORTANT NOTE**: Starfield Mod Loader supports ESP/ESM plugins, however please note that support is currently still considered **experimental** as the official Starfield Creation Kit modding tools have not yet been released. You will also need to install the **[Plugins.txt Enabler mod](https://www.nexusmods.com/starfield/mods/4157)** for plugins to load correctly.

By default, plugin support is disabled. Plugins can be enabled by going to **File > Preferences** and enabling plugins. Alternatively, you will be prompted to enable plugins when adding a mod with a plugin file.

Once plugins are enabled and at least one plugin has been installed, you will see your plugins listed along with their load order. Plugins can be disabled or re-ordered by dragging and dropping them.

## Activate your mods

To enable mods in the game you must first activate them. Press the **Activate Mods** button in the **Actions** section and your mods will be deployed to the **Mod Base Directory**.

Mods will now remain active until you press the **Deactivate Mods** button, even if you close the app or restart your PC.

**Important Note:** If you update any mod files externally (i.e. in a text editor), make sure to press the **Refresh Files** button, otherwise your changes will not be deployed to the **Mod Base Directory**.

## Launch the game

Click the **Start Game** button or launch the game directly from Steam or Game Pass. Your mods should now be active!

# Troubleshooting

If you run into a problem, please check the [issues page](https://github.com/lVlyke/starfield-mod-loader/issues) to see if your question has been answered or create a new issue if you have a bug to report.

# Devs - Building and testing

To build and run the app for testing and development, ensure you have Node and NPM installed on your machine and run `npm install` and `npm run start`.