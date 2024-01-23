// @ts-check

const chokidar = require("chokidar");
const { ipcRenderer } = require("electron");

const BUILD_DATE_FILE = `${__dirname}/lastbuild.txt`;

enableAppHotReload();

function enableAppHotReload() {
    chokidar.watch(BUILD_DATE_FILE, {
        interval: 500,
        usePolling: true,
        awaitWriteFinish: true
    }).on("change", () => {
        console.info("Hot reloading app");

        ipcRenderer.invoke("app:reload");
    });
}
