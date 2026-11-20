const https = require('https');

https.get('https://www.mmjunk.com', res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    console.log('Live H1 count:', h1Matches.length);
    h1Matches.forEach((h1, i) => console.log('H1 [' + (i+1) + ']:', h1.replace(/\s+/g, ' ').slice(0, 100)));
    const h2Social = /<h2[^>]*class="[^"]*social-clean-h1[^"]*"[^>]*>/gi.test(html);
    console.log('Hero B demoted to H2 exists:', h2Social);
  });
});
