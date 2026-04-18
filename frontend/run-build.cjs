const { execSync } = require('child_process')
const fs = require('fs')

try {
    const output = execSync('npx vite build', {
        cwd: 'c:\\Users\\monta\\Downloads\\hr-activity-recommender (3)',
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    })
    fs.writeFileSync('build-result.txt', 'SUCCESS:\n' + output, 'utf8')
    console.log('Build succeeded!')
} catch (err) {
    const output = (err.stdout || '') + '\n' + (err.stderr || '')
    fs.writeFileSync('build-result.txt', output, 'utf8')
    console.log('Build failed - errors written to build-result.txt')
}
