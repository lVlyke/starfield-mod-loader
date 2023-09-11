// @ts-check

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const url = require("url");
const path = require("path");
const fs = require("fs");
const os = require('os');

class ElectronLoader {
    
    /** @type BrowserWindow */ mainWindow;
    /** @type Record<string, any> */ monitoredPaths = {};
    /** @type Record<string, boolean> */ ignorePathChanges = {};

    constructor() {
        Menu.setApplicationMenu(this.createMenu());

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(() => {
            this.initWindow();

            // TODO - Only enable in debug mode
            // this.mainWindow.webContents.once("dom-ready", async () => {
            //     await installExtension([REDUX_DEVTOOLS])
            //         .then((name) => log.debug(`Added Extension:  ${name}`))
            //         .catch((err) => log.debug("An error occurred: ", err));
            // });

            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.initWindow();
                }
            });
        });

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        ipcMain.handle("app:reload", () => this.loadApp());
    }

    initWindow() {
        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            width: 1920,
            height: 1080,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
    
        this.loadApp();
    }

    loadApp() {
        // and load the index.html of the app.
        this.mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, `index.html`),
                protocol: "file:",
                slashes: true
            })
        );
    }

    /** @requires Menu */
    createMenu() {
        return Menu.buildFromTemplate([
            {
                label: 'File',
                submenu: [
                    {
                        label: "New Project...",
                        click: () => this.mainWindow.webContents.send("editor:newProject")
                    }
                ]
            },

            {
                label: 'View',
                submenu: [
                    {
                        role: 'toggleDevTools'
                    }
                ]
            },
        ]);
    }
}

// Load the app
const loader = new ElectronLoader();