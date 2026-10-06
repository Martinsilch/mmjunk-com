const fs = require('fs');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

async function run() {
  // 1. Minify CSS
  const cssSrc = fs.readFileSync('assets/css/style.src.css', 'utf8');
  const cssMinified = new CleanCSS({ level: 2 }).minify(cssSrc);
  if (cssMinified.errors.length > 0) {
    console.error('CSS Errors:', cssMinified.errors);
    process.exit(1);
  }
  fs.writeFileSync('assets/css/style.css', cssMinified.styles);
  if (fs.existsSync('public/assets/css')) {
    fs.writeFileSync('public/assets/css/style.css', cssMinified.styles);
  }
  console.log(`CSS: ${cssSrc.length} -> ${cssMinified.styles.length} bytes (saved ${(100 - (cssMinified.styles.length / cssSrc.length * 100)).toFixed(1)}%)`);

  // 2. Minify JS
  const jsSrc = fs.readFileSync('assets/js/main.src.js', 'utf8');
  const jsMinified = await minify(jsSrc, {
    compress: true,
    mangle: true
  });
  if (!jsMinified.code) {
    console.error('JS minification failed');
    process.exit(1);
  }
  fs.writeFileSync('assets/js/main.js', jsMinified.code);
  if (fs.existsSync('public/assets/js')) {
    fs.writeFileSync('public/assets/js/main.js', jsMinified.code);
  }
  console.log(`JS: ${jsSrc.length} -> ${jsMinified.code.length} bytes (saved ${(100 - (jsMinified.code.length / jsSrc.length * 100)).toFixed(1)}%)`);
}

run();
