// @ts-check
const { execSync } = require("child_process");

const RELEASE_MODE = process.argv.includes("--release");

execSync(
    "node ./scripts/fix-7zip-bin-permissions.js",
    { stdio: "inherit" }
);

execSync(
    `npx ng build ${RELEASE_MODE ? "--configuration production" : ""}`,
    { stdio: "inherit" }
);

execSync(
    "node ./scripts/copy-assets.js",
    { stdio: "inherit" }
);
