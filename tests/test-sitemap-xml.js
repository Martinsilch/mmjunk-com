const https = require('https');

https.get('https://www.mmjunk.com/sitemap.xml', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);
    console.log('First 50 chars:', JSON.stringify(data.slice(0, 50)));
    console.log('Last 50 chars:', JSON.stringify(data.slice(-50)));
    console.log('Index of <?xml:', data.indexOf('<?xml'));
    
    // Check if any whitespace before <?xml
    if (data.indexOf('<?xml') !== 0) {
      console.error('ERROR: Whitespace or BOM before <?xml!');
    } else {
      console.log('OK: <?xml starts at index 0.');
    }

    const urls = data.match(/<url>/g);
    console.log('Total <url> tags:', urls ? urls.length : 0);
    const locs = data.match(/<loc>(.*?)<\/loc>/g);
    console.log('Total <loc> tags:', locs ? locs.length : 0);
    
    const unescapedAmp = /&(?!amp;|lt;|gt;|quot;|apos;)/.test(data);
    console.log('Has unescaped ampersand:', unescapedAmp);
    
    // Check all URLs for validity
    const locMatches = [...data.matchAll(/<loc>(.*?)<\/loc>/g)];
    let invalidUrls = [];
    locMatches.forEach(m => {
      const u = m[1];
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.mmjunk.com') {
          invalidUrls.push(u);
        }
      } catch(e) {
        invalidUrls.push(u);
      }
    });
    console.log('Invalid URLs in sitemap:', invalidUrls.length > 0 ? invalidUrls : 'None');
  });
});
