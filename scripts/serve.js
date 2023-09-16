// @ts-check
const { exit } = require("process");
const execSync = require("child_process").execSync;
const spawn = require("child_process").spawn;

const RELEASE_MODE = process.argv.includes("--release");

const buildTask = spawn("npx", [
    "ng",
    "build",
    ...RELEASE_MODE ? ["--configuration", "production"] : [],
    "--watch",
    "--poll", 
    "1000"
]);

let electronProcess;

buildTask.stdout.on("data", (data) => {
    console.log(data.toString());

    if (data.toString().includes("Build at:")) {
        execSync(
            "node ./scripts/copy-assets.js",
            { stdio: "inherit" }
        );        

        if (!electronProcess) {
            console.log("Starting Electron app");

            electronProcess = spawn("npm", ["run", "electron:start"], { stdio: "inherit" });

            electronProcess.on("close", () => {
                console.log("Finished serving");
                exit();
            });
        }
    }
});

buildTask.stderr.on("data", (data) => console.error(data.toString()));