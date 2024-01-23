// @ts-check
const fs = require("fs-extra");
const execSync = require("child_process").execSync;
const spawn = require("child_process").spawn;

const BUILD_DIR = "./dist";
const BUILD_DATE_FILE = `${BUILD_DIR}/lastbuild.txt`;
const RELEASE_MODE = process.argv.includes("--release");
const DISABLE_SANDBOX = process.argv.includes("--no-sandbox");

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

    // Update the build date file (used for hot reloading)
    fs.writeJsonSync(BUILD_DATE_FILE, { date: new Date() });
                
    if (!electronProcess) {
        execSync(
            "node ./scripts/copy-assets.js",
            { stdio: "inherit" }
        );

        console.log("Starting Electron app");

        electronProcess = spawn("npx", [
            "electron",
            BUILD_DIR,
            ...DISABLE_SANDBOX ? ["--no-sandbox"] : []
        ]);

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

            process.exit();
        });
    }
});

buildTask.stderr.on("data", (data) => console.error(data.toString()));