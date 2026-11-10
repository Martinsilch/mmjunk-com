const fs = require('fs');
const path = require('path');

// Read current index.html as base
const baseHtml = fs.readFileSync('index.html', 'utf8');

// Switcher Bar Component HTML
function getSwitcherBar(activeVersion) {
  return `
  <!-- PREVIEW MODE SWITCHER BAR -->
  <div class="preview-switcher-bar">
    <div class="preview-switcher-inner">
      <div class="preview-label">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        <span>UI/UX Preview: <strong>Clean Social Profile Hero</strong></span>
      </div>
      <div class="preview-nav-group">
        <a href="/preview-1" class="preview-nav-btn ${activeVersion === 1 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 1 ? '● ' : ''}Clean Social Profile (Primary)
        </a>
        <a href="/preview-2" class="preview-nav-btn ${activeVersion === 2 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 2 ? '● ' : ''}Glassmorphic Variant
        </a>
        <a href="/" class="preview-nav-btn preview-nav-btn--return">
          ← Live Site
        </a>
      </div>
    </div>
  </div>
  `;
}

// Common styles for previews
const previewSharedStyles = `
<style id="preview-enhancement-styles">
/* Switcher Bar */
.preview-switcher-bar {
  position: sticky;
  top: 0;
  z-index: 999999;
  background: #090d16;
  border-bottom: 2px solid #ea580c;
  padding: 10px 16px;
  font-family: var(--font-sans);
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.preview-switcher-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.preview-label {
  font-weight: 700;
  font-size: 0.88rem;
  color: #f97316;
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.preview-nav-btn {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(255,255,255,0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.preview-nav-btn:hover {
  background: rgba(234, 88, 12, 0.2);
  border-color: #ea580c;
  color: #ffffff;
}
.preview-nav-btn--active {
  background: #ea580c !important;
  color: #ffffff !important;
  border-color: #ea580c !important;
  box-shadow: 0 0 12px rgba(234, 88, 12, 0.6);
}
.preview-nav-btn--return {
  background: transparent;
  border-color: rgba(255,255,255,0.25);
  color: #94a3b8;
}

/* Verified checkmark SVG icon */
.verified-check-svg {
  display: inline-block;
  vertical-align: middle;
  color: #38bdf8;
  flex-shrink: 0;
}

/* ============================================================
   CLEAN SOCIAL PROFILE HERO STYLES
   ============================================================ */
.social-clean-hero {
  position: relative;
  background: #090d16;
  color: #ffffff;
  padding-bottom: 50px;
}
.social-clean-cover {
  position: relative;
  height: 260px;
  overflow: hidden;
  background: #0b1120;
}
.social-clean-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}
.social-clean-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9,13,22,0.15) 0%, rgba(9,13,22,0.7) 70%, #090d16 100%);
}
.social-clean-container {
  max-width: 1140px;
  margin: -75px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}
.social-clean-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 24px 30px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05);
}
.social-clean-card--glass {
  background: rgba(17, 24, 39, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(234, 88, 12, 0.3);
}
.social-clean-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.social-clean-identity {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}
.social-clean-avatar {
  width: 114px;
  height: 114px;
  border-radius: 50%;
  border: 4px solid #111827;
  box-shadow: 0 0 0 3px #ea580c;
  object-fit: cover;
  margin-top: -57px;
  background: #1f2937;
  flex-shrink: 0;
}
.social-clean-name-block {
  padding-bottom: 2px;
}
.social-clean-name {
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  line-height: 1.2;
}
.social-clean-handle {
  font-size: 0.95rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 4px 0 0 0;
}
.social-clean-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.social-clean-h1 {
  font-size: clamp(1.65rem, 3.8vw, 2.35rem);
  font-weight: 800;
  line-height: 1.22;
  color: #ffffff;
  margin: 0 0 14px 0;
  letter-spacing: -0.015em;
}
.social-clean-h1 span {
  color: #f97316;
}
.social-clean-desc {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #e2e8f0;
  margin: 0 0 20px 0;
  max-width: 950px;
}
.social-clean-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.social-meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .social-clean-container {
    margin-top: -55px;
    padding: 0 14px;
  }
  .social-clean-card {
    padding: 20px 16px;
  }
  .social-clean-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }
  .social-clean-identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .social-clean-avatar {
    width: 88px;
    height: 88px;
    margin-top: -44px;
  }
  .social-clean-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  .social-clean-actions .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
  .social-clean-h1 {
    font-size: 1.55rem;
    line-height: 1.25;
  }
  .social-clean-desc {
    font-size: 0.96rem;
  }
  .social-clean-meta {
    gap: 10px;
    font-size: 0.82rem;
  }
}
</style>
`;

// Helper: Verified SVG
const verifiedSvg = `
<svg class="verified-check-svg" width="20" height="20" viewBox="0 0 24 24" fill="#38bdf8" title="Verified Local Owner &amp; Operator">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

// ============================================================
// BUILD CLEAN SOCIAL PROFILE (PRIMARY VERSION)
// ============================================================
function buildCleanSocial(versionNum, isGlass = false) {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-${versionNum}">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview: Clean Social Profile] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(versionNum)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="social-clean-hero" id="hero">
      <!-- Panoramic Cover Banner -->
      <div class="social-clean-cover">
        <img src="/assets/images/team-hero.webp" 
             alt="M&amp;M Junk Removal Fleet Cover Banner" 
             width="1920" height="1080" 
             fetchpriority="high">
        <div class="social-clean-cover-overlay"></div>
      </div>

      <!-- Social Profile Container -->
      <div class="social-clean-container">
        <div class="social-clean-card ${isGlass ? 'social-clean-card--glass' : ''}">
          
          <!-- Top Row: Avatar + Identity + Action Buttons -->
          <div class="social-clean-top">
            <div class="social-clean-identity">
              <img class="social-clean-avatar" 
                   src="/assets/images/martin-silchuk-avatar.webp" 
                   alt="Martin Silchuk - Owner &amp; Lead Operator" 
                   width="114" height="114">
              <div class="social-clean-name-block">
                <div class="social-clean-name">
                  <span>Martin Silchuk</span>
                  ${verifiedSvg}
                </div>
                <p class="social-clean-handle">
                  @mmjunk • Founder &amp; Lead Operator • Est. 2007
                </p>
              </div>
            </div>

            <!-- Direct Booking & Phone Actions -->
            <div class="social-clean-actions">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book Online in 30 Sec (AMZY) ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--md" aria-label="Call Martin directly">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Call: (253) 886-7724
              </a>
            </div>
          </div>

          <!-- PRIMARY H1 HEADLINE: Company Name + Service Provided + Base in Federal Way -->
          <h1 class="social-clean-h1">
            M&amp;M Junk Removal — Fast &amp; Reliable Junk Hauling Based in <span>Federal Way, WA</span>
          </h1>

          <!-- QUICK CONCISE DESCRIPTION -->
          <p class="social-clean-desc">
            "We Haul Junk to the Dump" — Fast, friendly, and fair-priced hauling by owner Martin Silchuk. Zero franchise overhead, upfront volume rates, and we match &amp; beat any licensed competitor's price by 10% across Federal Way, Pierce &amp; South King County.
          </p>

          <!-- CLEAN METADATA STRIP (Single Line, No Clutter) -->
          <div class="social-clean-meta">
            <div class="social-meta-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ea580c"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              <span>Based in Federal Way, WA</span>
            </div>
            <div class="social-meta-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              <span>Licensed &amp; Insured (UBI Active)</span>
            </div>
            <a href="#reviews" class="social-meta-pill" style="color: inherit; text-decoration: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <span><strong>258+ Verified Reviews</strong> (5.0 ★ Google &amp; Yelp)</span>
            </a>
            <div class="social-meta-pill">
              <span style="font-weight: 800; color: #ea580c;">10%</span>
              <span>Rate Beat Guarantee</span>
            </div>
            <div class="social-meta-pill">
              <span class="live-pulse"></span>
              <span style="color: #22c55e; font-weight: 700;">Same-Day Standby</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// Build Preview 1 (Clean Primary) & Preview 2 (Glassmorphic) & Preview 3 (Redirect / Clean)
const v1 = buildCleanSocial(1, false);
const v2 = buildCleanSocial(2, true);
const v3 = buildCleanSocial(3, false);

const outputs = [
  { dir: 'preview-1', content: v1 },
  { dir: 'preview-2', content: v2 },
  { dir: 'preview-3', content: v3 }
];

outputs.forEach(({ dir, content }) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), content, 'utf8');

  const pubDir = path.join('public', dir);
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, 'index.html'), content, 'utf8');

  console.log(`Generated ${dir}/index.html and public/${dir}/index.html`);
});

console.log('Clean social profile hero previews built successfully!');
