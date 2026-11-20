const fs = require('fs');
const path = require('path');

const targetFiles = [
  'preview-1/index.html',
  'public/preview-1/index.html',
  'preview-2/index.html',
  'public/preview-2/index.html',
  'preview-3/index.html',
  'public/preview-3/index.html',
  'services/commercial/index.html',
  'public/services/commercial/index.html',
  'services/industrial/index.html',
  'public/services/industrial/index.html',
  'services/residential/index.html',
  'public/services/residential/index.html',
  'services/sorting-donation/index.html',
  'public/services/sorting-donation/index.html',
  'scripts/generate-agent-json.js',
  'scripts/update-harmonization.js',
  'scripts/update-manifests.js'
];

targetFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/\$154 - \$286/g, '$176 - $264');
    content = content.replace(/\$154–\$286/g, '$176–$264');
    content = content.replace(/\$308 - \$572/g, '$352 - $528');
    content = content.replace(/\$308–\$572/g, '$352–$528');
    content = content.replace(/\$462 - \$858/g, '$528 - $792');
    content = content.replace(/\$462–\$858/g, '$528–$792');
    content = content.replace(/\$840 - \$1,560/g, '$960 - $1,440');
    content = content.replace(/\$840 - \$1560/g, '$960 - $1440');
    content = content.replace(/\$840–\$1,560/g, '$960–$1,440');
    content = content.replace(/\$840–\$1560/g, '$960–$1440');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated pricing in ${file}`);
    }
  }
});
