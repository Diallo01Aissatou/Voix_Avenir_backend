const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
    if (line.includes('GOOGLE_CLIENT_ID')) {
        console.log(`|${line}|`);
        console.log('Length:', line.length);
        console.log('Char codes:', [...line].map(c => c.charCodeAt(0)));
    }
});
