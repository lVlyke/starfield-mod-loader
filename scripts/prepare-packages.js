// @ts-check
const fs = require("fs");
const Seven = require("node-7z");
const sevenBin = require("7zip-bin");
const { version } = require("../package.json");

const PKG_DIR = "./out";
const SEQUENTIAL_MODE = process.argv.includes("--sequential");

(async() => {
    process.chdir(PKG_DIR);

    const packages = fs.readdirSync(".");
    const tasks = [];

    for (const pkgPath of packages) {
        if (fs.existsSync(pkgPath)) {
            if (fs.lstatSync(pkgPath).isDirectory() && !pkgPath.includes("template")) {
                const archivePath = `${pkgPath}_${version}.7z`;

                fs.rmSync(archivePath, { force: true });

                console.log(`Archiving package ${archivePath}`);

                const compressTask = new Promise((resolve, reject) => {
                    const compressStream = Seven.add(archivePath, pkgPath, {
                        $bin: sevenBin.path7za
                    });

                    compressStream.on("end", () => resolve(true));
                    compressStream.on("error", err => reject(err));
                });
        
                if (SEQUENTIAL_MODE) {
                    await compressTask;
                } else {
                    tasks.push(compressTask);
                }
            } else {
                fs.rmSync(pkgPath, { force: true });
            }
        }
    }

    await Promise.all(tasks);

    process.chdir("..");
})();
