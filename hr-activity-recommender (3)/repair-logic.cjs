const fs = require('fs')
const path = require('path')

const directory = 'c:/Users/monta/Downloads/hr-activity-recommender (3)'

function walk(dir, callback) {
    const files = fs.readdirSync(dir)
    files.forEach((file) => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
                walk(filePath, callback)
            }
        } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            callback(filePath)
        }
    })
}

walk(directory, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false

    // Fix patterns like "propertyName Date(" to "propertyName: new Date("
    // Note: These usually occur inside { ... }

    // 1. Fix missing colons for Date, Math, JSON, etc.
    // We only want to match if it's NOT already preceded by a colon or isn't already the correct form.
    const patterns = [
        { regex: /(?<![:\w])(\w+)\s+Date\(/g, replace: '$1: new Date(' },
        { regex: /(?<![:\w])(\w+)\s+Date\.now\(\)/g, replace: '$1: Date.now()' },
        { regex: /(?<![:\w])(\w+)\s+Math\.round\(/g, replace: '$1: Math.round(' },
        { regex: /(?<![:\w])(\w+)\s+JSON\.parse\(/g, replace: '$1: JSON.parse(' },
        { regex: /(?<![:\w])(\w+)\s+JSON\.stringify\(/g, replace: '$1: JSON.stringify(' },
        { regex: /(?<![:\w])(\w+)\s+item\.id/g, replace: '$1: item.id' },
        { regex: /(?<![:\w])(\w+)\s+rec\./g, replace: '$1: rec.' },
        { regex: /(?<![:\w])(\w+)\s+employee\./g, replace: '$1: employee.' },
        { regex: /(?<![:\w])(\w+)\s+user\./g, replace: '$1: user.' },
        { regex: /(?<![:\w])(\w+)\s+(\w+)\s*\|\|\s*undefined/g, replace: '$1: $2 || undefined' },
        { regex: /(?<![:\w])(\w+)\s+(\w+)\s*\|\|\s*""/g, replace: '$1: $2 || ""' },
        { regex: /(?<!Math)(?<![:\w])(\w+)\.round\(/g, replace: '$1: Math.round(' }
    ]

    let newContent = content
    patterns.forEach(p => {
        if (p.regex.test(newContent)) {
            newContent = newContent.replace(p.regex, p.replace)
            changed = true
        }
    })

    // 2. Fix corrupted Array.map logic observed in lib/data-store.jsx (sometimes it might happen again)
    // e.g. "employees.employees.map" -> "employees: employees.map"
    const collectionRegex = /(\w+)[\s,]+(\w+)\.(\w+)\.map/g
    if (collectionRegex.test(newContent)) {
        newContent = newContent.replace(collectionRegex, '$1: $2.$3.map')
        changed = true
    }

    if (changed) {
        fs.writeFileSync(filePath, newContent)
        console.log(`Repaired logic in ${filePath}`)
    }
})
