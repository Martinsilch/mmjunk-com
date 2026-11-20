const https = require('https');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve({
        url,
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        cacheControl: res.headers['cache-control']
      });
    }).on('error', reject);
  });
}

async function run() {
  const urls = [
    'https://www.mmjunk.com/knowledge/index.json',
    'https://www.mmjunk.com/knowledge/pricing-logic.json',
    'https://www.mmjunk.com/knowledge/pricing-logic.md',
    'https://www.mmjunk.com/llms-workflows.txt',
    'https://www.mmjunk.com/llms.txt',
    'https://www.mmjunk.com/.well-known/agent.json',
    'https://www.mmjunk.com/.well-known/pricing.json'
  ];

  console.log('Fetching live headers from mmjunk.com...');
  for (const url of urls) {
    try {
      const res = await checkUrl(url);
      console.log(`[${res.statusCode}] ${res.url} -> ${res.contentType}`);
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }
}

run();
