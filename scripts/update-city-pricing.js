const fs = require('fs');

const CITIES = ['auburn', 'edgewood', 'federal-way', 'kent', 'tacoma'];

CITIES.forEach(city => {
  const paths = [
    `junk-removal-${city}-wa/index.html`,
    `public/junk-removal-${city}-wa/index.html`
  ];

  paths.forEach(p => {
    if (fs.existsSync(p)) {
      let content = fs.readFileSync(p, 'utf8');
      content = content.replace(/\$154 - \$286/g, '$176 - $264');
      content = content.replace(/\$308 - \$572/g, '$352 - $528');
      content = content.replace(/\$840 - \$1,560/g, '$960 - $1,440');
      content = content.replace(/\$840 - \$1560/g, '$960 - $1440');
      fs.writeFileSync(p, content, 'utf8');
      console.log(`Updated pricing in ${p}`);
    }
  });
});
