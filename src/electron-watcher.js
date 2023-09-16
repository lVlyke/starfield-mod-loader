const chokidar = require("chokidar");
const { ipcRenderer } = require("electron");

enableAppHotReload();

function enableAppHotReload() {
    chokidar.watch(__dirname).on("change", () => {
        setTimeout(() => {
            console.info("Hot reloading app");

            ipcRenderer.invoke("app:reload");
        }, 500);
    });
}
