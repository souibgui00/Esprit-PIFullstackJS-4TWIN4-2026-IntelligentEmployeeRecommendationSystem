const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const targetDirs = ['app', 'components', 'lib', 'src', 'hooks'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const safePatterns = [
    // 0. Remove Blocks (Interfaces, Types) - Greedy but stopped by next 'export' or 'const' or 'function' to be safe
    // We look for interface/type until a closing brace that is followed by a newline and some non-indented char
    { regex: /import\s+type\s+[\s\S]*?from\s+['"].*?['"](?=;?)/g, replace: '' },
    { regex: /export\s+interface\s+\w+\s*\{[\s\S]*?\n\}(?=\s*?\n|$)/g, replace: '' },
    { regex: /interface\s+\w+\s*\{[\s\S]*?\n\}(?=\s*?\n|$)/g, replace: '' },
    { regex: /export\s+type\s+\w+\s*=\s*[\s\S]*?(?=;|\n\n|\n[^\s])/g, replace: '' },
    { regex: /type\s+\w+\s*=\s*[\s\S]*?(?=;|\n\n|\n[^\s])/g, replace: '' },

    // 1. Function parameters with types: (id: string, name: any) -> (id, name)
    // 1. Colon Types: (arg: Type) -> (arg)
    // We match : followed by any non-special chars until , ) = { ;
    // 1. Colon Types: (arg: Type) -> (arg)
    // We match : followed by many common TS type forms, but NOT literals to avoid breaking object properties
    { regex: /:\s*(?:[A-Z]\w*|string|number|boolean|any|void|unknown|never|Omit<[\s\S]*?>|Partial<[\s\S]*?>|Promise<[\s\S]*?>|keyof\s+\w+)(?:\[\])?(?=[,\)\s=\;]|$)/g, replace: '' },
    // Specific fix for literal types in function signatures: (mode: "add" | "edit")
    { regex: /(\w+):\s*(?:'[^']+'|"[^"]+")(?:\s*\|\s*(?:'[^']+'|"[^"]+"))*(?=[,\)\s]|$)/g, replace: '$1' },
    // Optional parameters: (user?: User) -> (user)
    { regex: /(\w+)\?\s*(?=[:,\)\s=]|$)/g, replace: '$1' },

    // 2. Generic Closures: <Type>
    // Hooks only - slightly more greedy to catch Records/Nested types but stopping before arguments
    { regex: /(useState|useCallback|useMemo|useSelector|useContext|createContext|useRef|useConfig)\s*<[^(\n]+>/g, replace: '$1' },
    // General - very careful
    { regex: /<[A-Z]\w*(?:\s*\|\s*[A-Z]\w*)*>(?=\s*\(|(?:\s*[,;\]\)]))/g, replace: '' },

    // Residue fix for failed generic matches
    { regex: /useState>/g, replace: 'useState' },

    // 3. Type Assertions: as Type
    { regex: /\s+as\s+[A-Z]\w*(?:<[^>]+>)?(?:\[\])?(?=[,;\]\)\s]|$)/g, replace: '' },
    { regex: /\s+as\s+(?:any|unknown|string\[\]|keyof\s+typeof\s+\w+)(?=[,;\]\)\s]|$)/g, replace: '' },

    // 4. Import cleanup
    { regex: /,\s*type\s+[A-Z]\w*/g, replace: '' },
    { regex: /type\s+[A-Z]\w*\s*,/g, replace: '' },

    // 5. Destructuring residue
    { regex: /\}\s*:\s*\{[^}]+\}/g, replace: '}' },

    // 6. Fix common corruption
    { regex: /matchScore:\s*Math:\s*Math\.round/g, replace: 'matchScore: Math.round' },
    { regex: /Math:\s*Math\.round/g, replace: 'Math.round' },
    { regex: /new:\s*new\s+Date/g, replace: 'new Date' },

    // 7. Remove residue (targeted)
    { regex: /^[\s>]*\s*logout:.*$/gm, replace: '' },
    { regex: /^[\s>]*\s*getEmployeeProfile:.*$/gm, replace: '' },
    { regex: /^[\s>]*\s*isAuthenticated:.*$/gm, replace: '' },
    { regex: /^\s*user:\s*User\s*\|\s*null\s*$/gm, replace: '' },
];

targetDirs.forEach(dir => {
    const fullDir = path.join(rootDir, dir);
    if (!fs.existsSync(fullDir)) return;

    const files = walk(fullDir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let changed = false;

        safePatterns.forEach(p => {
            const newContent = content.replace(p.regex, p.replace);
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(file, content);
            console.log(`Repaired: ${file}`);
        }
    });
});
