// @ts-check
const { execSync } = require("child_process");

const RELEASE_MODE = process.argv.includes("--release");

execSync(
    `npx ng build ${RELEASE_MODE ? "--configuration production" : ""}`,
    { stdio: "inherit" }
);

execSync(
    "node ./scripts/copy-assets.js",
    { stdio: "inherit" }
);
