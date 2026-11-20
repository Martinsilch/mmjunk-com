const https = require('https');

const userAgents = [
  { name: 'Default / None', ua: '' },
  { name: 'Python Requests', ua: 'python-requests/2.31.0' },
  { name: 'curl', ua: 'curl/8.4.0' },
  { name: 'GPTBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)' },
  { name: 'PerplexityBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' },
  { name: 'ClaudeBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
  { name: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { name: 'Gemini Web Probe', ua: 'Google-Extended/1.0' }
];

const paths = [
  '/.well-known/agent.json',
  '/robots.txt',
  '/llms.txt'
];

async function testAll() {
  for (const p of paths) {
    console.log(`\nTesting Path: https://www.mmjunk.com${p}`);
    for (const bot of userAgents) {
      await new Promise(resolve => {
        const req = https.request({
          hostname: 'www.mmjunk.com',
          path: p,
          method: 'GET',
          headers: bot.ua ? { 'User-Agent': bot.ua } : {}
        }, res => {
          console.log(`  [${res.statusCode}] ${bot.name} (Content-Type: ${res.headers['content-type'] || 'none'})`);
          res.resume();
          resolve();
        });
        req.on('error', err => {
          console.log(`  [ERR] ${bot.name}: ${err.message}`);
          resolve();
        });
        req.end();
      });
    }
  }
}

testAll();
