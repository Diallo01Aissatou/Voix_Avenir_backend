const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remplacement pour les vérifications de .photo
  const regex = /(![a-zA-Z0-9_.]+\.photo\.startsWith\('http'\))/g;
  content = content.replace(regex, (match) => {
    // match: !requestObj.mentore.photo.startsWith('http')
    // varName: requestObj.mentore.photo
    const varName = match.split('.startsWith')[0].substring(1);
    return `${match} && !${varName}.startsWith('data:')`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

fs.readdirSync(controllersDir).forEach(file => {
  if (file.endsWith('.js')) {
    processFile(path.join(controllersDir, file));
  }
});
