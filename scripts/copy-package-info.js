//@ts-check
const fs = require("fs");
const path = require("path");

const BUILD_DIR = "./dist";
const ASSETS = {
    "package.json": "package.json",
    "src/electron.js": "electron.js",
    "src/electron-watcher.js": "electron-watcher.js"
};

const assetFiles = Object.keys(ASSETS);
assetFiles.forEach((assetFile) => {
    fs.writeFileSync(path.join(BUILD_DIR, ASSETS[assetFile]), fs.readFileSync(assetFile));
});
