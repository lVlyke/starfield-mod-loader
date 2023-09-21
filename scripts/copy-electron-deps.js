//@ts-check
const fs = require("fs-extra");
const path = require("path");

const BUILD_DIR = "./dist";

// All deps used in `electron.js`
const DEPENDENCIES = [
    "electron-log",
    "fs-extra",
    "graceful-fs",
    "jsonfile",
    "universalify",
    "lodash",
    "lodash.defaultsdeep",
    "lodash.defaultto",
    "lodash.flattendeep",
    "lodash.isempty",
    "lodash.negate",
    "node-7z",
    "debug",
    "ms",
    "normalize-path",
    "7zip-bin",
    "recursive-readdir",
    "minimatch",
    "brace-expansion",
    "balanced-match",
    "concat-map"
];

fs.mkdirSync(BUILD_DIR, { recursive: true })

DEPENDENCIES.forEach((dep) => {
    fs.copySync(`node_modules/${dep}`, path.join(BUILD_DIR, `node_modules/${dep}`));
});
