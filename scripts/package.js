// @ts-check
const { execSync } = require("child_process");
const fs = require("fs");
const fsPromises = require("fs").promises;

const BUILD_DIR = "./dist";
const PKG_DIR = "./out";
const BUILD_ALL = process.argv.includes("--all");
const RELEASE_MODE = process.argv.includes("--release");

(async () => {
    const clearPkgDirTask = fsPromises.rm(PKG_DIR, { recursive: true, force: true });

    if (RELEASE_MODE || !fs.existsSync(BUILD_DIR)) {
        execSync(
            `node ./scripts/build.js ${RELEASE_MODE ? "--release" : ""}`,
            { stdio: "inherit" }
        );
    }
    
    execSync(
        "node ./scripts/copy-electron-deps.js",
        { stdio: "inherit" }
    );

    // Clear out dir while doing prework
    await clearPkgDirTask;
    
    execSync([
        "npx electron-packager ./dist starfield-mod-loader --out ./out --overwrite --no-tmpdir",
        BUILD_ALL ? " --platform 'win32, linux, darwin' --arch 'ia32, x64, armv7l, arm64'" : ""
    ].join(""), { stdio: "inherit" });
})();
