// @ts-check
const { exit } = require("process");
const execSync = require("child_process").execSync;
const spawn = require("child_process").spawn;

const BUILD_DIR = "./dist";
const RELEASE_MODE = process.argv.includes("--release");

execSync(
    "node ./scripts/fix-7zip-bin-permissions.js",
    { stdio: "inherit" }
);

const buildTask = spawn("npx", [
    "ng",
    "build",
    "--configuration",
    RELEASE_MODE ? "production" : "development",
    "--watch",
    "--poll", 
    "1000"
], { detached: true });

let electronProcess;

buildTask.stdout.on("data", (data) => {
    console.log(data.toString());

    if (data.toString().includes("Build at:")) {
                
        if (!electronProcess) {
            execSync(
                "node ./scripts/copy-assets.js",
                { stdio: "inherit" }
            );

            console.log("Starting Electron app");

            electronProcess = spawn("npx", ["electron", BUILD_DIR]);

            electronProcess.stdout.on("data", (data) => {
                console.log(data.toString());
            });

            electronProcess.on("close", () => {
                console.log("Finished serving");

                // Kill ng build process
                if (buildTask.pid) {
                    process.kill(-buildTask.pid);
                    buildTask.kill();
                }

                exit();
            });
        }
    }
});

buildTask.stderr.on("data", (data) => console.error(data.toString()));