//@ts-check
const fs = require("fs-extra");
const path = require("path");

const BUILD_DIR = "./dist";

const ASSETS = {
    "package.json": "package.json",
    "src/electron.js": "electron.js",
    "src/electron-watcher.js": "electron-watcher.js"
};

fs.mkdirSync(BUILD_DIR, { recursive: true })

const assetFiles = Object.keys(ASSETS);
assetFiles.forEach((assetFile) => {
    fs.copySync(assetFile, path.join(BUILD_DIR, ASSETS[assetFile]));
});
