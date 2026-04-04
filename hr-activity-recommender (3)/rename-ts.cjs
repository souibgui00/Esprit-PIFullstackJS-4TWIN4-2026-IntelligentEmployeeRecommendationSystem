const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components', 'lib', 'src', 'hooks'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

targetDirs.forEach(dir => {
    const fullDir = path.join(__dirname, dir);
    if (!fs.existsSync(fullDir)) return;

    const tsFiles = walk(fullDir);
    tsFiles.forEach(tsFile => {
        const isTsx = tsFile.endsWith('.tsx');
        const jsFile = isTsx ? tsFile.slice(0, -4) + '.jsx' : tsFile.slice(0, -3) + '.js';

        if (fs.existsSync(jsFile)) {
            fs.unlinkSync(jsFile);
        }
        fs.renameSync(tsFile, jsFile);
        console.log(`Renamed: ${tsFile} -> ${jsFile}`);
    });
});
