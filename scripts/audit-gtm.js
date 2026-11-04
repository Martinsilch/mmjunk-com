/**
 * M&M Junk Removal - Google Tag Manager Live Audit CLI
 * 
 * Audits tags, triggers, and variables inside the GTM container.
 * 
 * Usage:
 *   node scripts/audit-gtm.js
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '..', 'google-service-account.json');

if (!fs.existsSync(KEY_FILE)) {
  console.error(`❌ Key file not found at ${KEY_FILE}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/tagmanager.readonly']
});

const tagmanager = google.tagmanager({ version: 'v2', auth });

async function auditGtm() {
  console.log(`\n======================================================`);
  console.log(`  GTM LIVE CONTAINER & TAGS AUDIT`);
  console.log(`======================================================\n`);

  try {
    const accRes = await tagmanager.accounts.list();
    const accounts = accRes.data.account || [];
    if (accounts.length === 0) {
      console.log('No GTM accounts found.');
      return;
    }

    for (const acc of accounts) {
      console.log(`Account: ${acc.name} (${acc.accountId})`);
      const contRes = await tagmanager.accounts.containers.list({ parent: acc.path });
      const containers = contRes.data.container || [];

      for (const cont of containers) {
        console.log(`  Container: ${cont.name} [${cont.publicId}]`);
        const wsRes = await tagmanager.accounts.containers.workspaces.list({ parent: cont.path });
        const defaultWs = (wsRes.data.workspace || [])[0];

        if (!defaultWs) continue;

        // Fetch Tags
        const tagsRes = await tagmanager.accounts.containers.workspaces.tags.list({ parent: defaultWs.path });
        const tags = tagsRes.data.tag || [];

        // Fetch Triggers
        const trgRes = await tagmanager.accounts.containers.workspaces.triggers.list({ parent: defaultWs.path });
        const triggers = trgRes.data.trigger || [];
        const triggerMap = new Map(triggers.map(t => [t.triggerId, t.name]));

        console.log(`\n  Active Tags (${tags.length}):`);
        tags.forEach((tag, idx) => {
          const firing = (tag.firingTriggerId || []).map(id => triggerMap.get(id) || id).join(', ');
          console.log(`    ${idx + 1}. [${tag.type}] ${tag.name}`);
          if (firing) {
            console.log(`       Trigger: ${firing}`);
          }
          const eventParam = (tag.parameter || []).find(p => p.key === 'eventName');
          const measId = (tag.parameter || []).find(p => p.key === 'measurementIdOverride' || p.key === 'tagId' || p.key === 'destinationId');
          if (eventParam) {
            console.log(`       Event:   ${eventParam.value}`);
          }
          if (measId) {
            console.log(`       Target:  ${measId.value}`);
          }
        });

        console.log(`\n  Active Triggers (${triggers.length}):`);
        triggers.forEach((trg, idx) => {
          console.log(`    ${idx + 1}. [${trg.type}] ${trg.name}`);
        });
      }
    }

    console.log('\n');
  } catch (err) {
    console.error('❌ GTM Audit Error:', err.message);
  }
}

auditGtm();
