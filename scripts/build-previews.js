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
        <span>UI/UX Preview: <strong>Social &amp; Pro Profile Evolution</strong></span>
      </div>
      <div class="preview-nav-group">
        <a href="/preview-1" class="preview-nav-btn ${activeVersion === 1 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 1 ? '● ' : ''}Concept 1: LinkedIn Pro Profile
        </a>
        <a href="/preview-2" class="preview-nav-btn ${activeVersion === 2 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 2 ? '● ' : ''}Concept 2: Social Resume Dossier
        </a>
        <a href="/preview-3" class="preview-nav-btn ${activeVersion === 3 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 3 ? '● ' : ''}Concept 3: Hybrid Fleet Bridge
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

/* Verified checkmark SVG icon helper */
.verified-check-svg {
  display: inline-block;
  vertical-align: middle;
  color: #38bdf8;
  flex-shrink: 0;
}

/* Pulse animation */
@keyframes online-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.pulse-online {
  animation: online-pulse 2s infinite;
}

/* Common Cover Style */
.pro-cover-wrap {
  position: relative;
  height: 250px;
  overflow: hidden;
  background: #090d16;
}
.pro-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.78;
}
.pro-cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9,13,22,0.1) 0%, rgba(9,13,22,0.65) 60%, #090d16 100%);
}

/* ============================================================
   CONCEPT 1 STYLES: LinkedIn-Style Professional Profile
   ============================================================ */
.linkedin-container {
  max-width: 1140px;
  margin: -75px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}
.linkedin-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 24px 30px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.55);
}
.linkedin-header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.linkedin-identity {
  display: flex;
  align-items: flex-end;
  gap: 22px;
}
.linkedin-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #111827;
  box-shadow: 0 0 0 3px #0284c7;
  object-fit: cover;
  margin-top: -60px;
  background: #1e293b;
  flex-shrink: 0;
}
.linkedin-name-title {
  padding-bottom: 2px;
}
.linkedin-name {
  font-size: 1.7rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  line-height: 1.2;
}
.linkedin-headline {
  font-size: 1rem;
  color: #cbd5e1;
  font-weight: 600;
  margin: 4px 0 0 0;
}
.linkedin-subline {
  font-size: 0.86rem;
  color: #94a3b8;
  margin: 4px 0 0 0;
}
.linkedin-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.linkedin-credentials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin: 20px 0;
  padding: 16px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.linkedin-cred-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.linkedin-cred-icon {
  width: 22px;
  height: 22px;
  color: #ea580c;
  flex-shrink: 0;
  margin-top: 2px;
}
.linkedin-cred-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.linkedin-cred-val {
  font-size: 0.92rem;
  font-weight: 700;
  color: #ffffff;
  margin-top: 2px;
}
.linkedin-cred-detail {
  font-size: 0.78rem;
  color: #cbd5e1;
  margin-top: 2px;
}
.linkedin-about-box {
  background: rgba(15, 23, 42, 0.6);
  border-left: 4px solid #ea580c;
  padding: 16px 18px;
  border-radius: 0 12px 12px 0;
  margin-top: 14px;
}
.linkedin-about-heading {
  font-size: 0.82rem;
  font-weight: 800;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.linkedin-about-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #e2e8f0;
  margin: 0;
}
@media (max-width: 768px) {
  .linkedin-container {
    margin-top: -55px;
    padding: 0 14px;
  }
  .linkedin-card {
    padding: 20px 16px;
  }
  .linkedin-header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .linkedin-identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .linkedin-avatar {
    width: 90px;
    height: 90px;
    margin-top: -45px;
  }
  .linkedin-action-bar {
    width: 100%;
    flex-direction: column;
  }
  .linkedin-action-bar .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
  .linkedin-credentials-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================================
   CONCEPT 2 STYLES: Social Resume & Operator Dossier
   ============================================================ */
.resume-hero-wrap {
  position: relative;
  background: #090d16;
  color: #ffffff;
  padding: 24px 0 60px;
}
.resume-dossier-card {
  max-width: 1140px;
  margin: 0 auto;
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.6);
  position: relative;
  overflow: hidden;
}
.resume-dossier-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #ea580c 0%, #0284c7 50%, #22c55e 100%);
}
.resume-top-telemetry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 24px;
}
.resume-telemetry-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.resume-header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
  margin-bottom: 26px;
}
.resume-avatar-wrap {
  position: relative;
}
.resume-avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  object-fit: cover;
  border: 3px solid #ea580c;
  display: block;
}
.resume-name-block h1 {
  font-size: 1.85rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  line-height: 1.2;
}
.resume-title-role {
  font-size: 1.05rem;
  color: #ea580c;
  font-weight: 700;
  margin: 4px 0 0 0;
}
.resume-location-contact {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.resume-header-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.resume-metrics-quad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}
.resume-metric-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px 14px;
  position: relative;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.resume-metric-card:hover {
  border-color: rgba(234, 88, 12, 0.4);
  transform: translateY(-2px);
}
.resume-metric-icon {
  font-size: 1.3rem;
  margin-bottom: 6px;
}
.resume-metric-title {
  font-size: 0.74rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.resume-metric-val {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  margin-top: 2px;
}
.resume-metric-sub {
  font-size: 0.78rem;
  color: #cbd5e1;
  margin-top: 3px;
  line-height: 1.35;
}
.resume-skills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
}
.resume-skill-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.07);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.resume-skill-badge--active {
  background: rgba(234, 88, 12, 0.2);
  color: #ea580c;
  border-color: rgba(234, 88, 12, 0.4);
}
@media (max-width: 900px) {
  .resume-metrics-quad {
    grid-template-columns: repeat(2, 1fr);
  }
  .resume-header-grid {
    grid-template-columns: 1fr;
    text-align: left;
  }
  .resume-header-actions {
    flex-direction: row;
    width: 100%;
  }
  .resume-header-actions .btn {
    flex: 1;
  }
}
@media (max-width: 600px) {
  .resume-metrics-quad {
    grid-template-columns: 1fr;
  }
  .resume-dossier-card {
    padding: 20px 16px;
  }
  .resume-header-actions {
    flex-direction: column;
  }
  .resume-header-actions .btn {
    width: 100%;
  }
}

/* ============================================================
   CONCEPT 3 STYLES: Hybrid Social Bridge & Verified Fleet Deck
   ============================================================ */
.hybrid-hero-wrap {
  position: relative;
  background: #090d16;
  color: #ffffff;
  padding-bottom: 60px;
}
.hybrid-container {
  max-width: 1140px;
  margin: -75px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}
.hybrid-main-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 22px;
  padding: 24px 28px;
  box-shadow: 0 24px 50px rgba(0,0,0,0.6);
}
.hybrid-profile-split {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
  align-items: flex-start;
}
.hybrid-creator-side {
  padding-right: 10px;
}
.hybrid-avatar-row {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 16px;
}
.hybrid-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 4px solid #111827;
  box-shadow: 0 0 0 3px #ea580c;
  object-fit: cover;
  margin-top: -55px;
  background: #1e293b;
  flex-shrink: 0;
}
.hybrid-author-name {
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  line-height: 1.2;
}
.hybrid-handle-tag {
  font-size: 0.92rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 4px 0 0 0;
}
.hybrid-bio {
  font-size: 1rem;
  line-height: 1.6;
  color: #cbd5e1;
  margin: 0 0 16px 0;
}
.hybrid-fleet-deck {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hybrid-deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.hybrid-deck-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hybrid-spec-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88rem;
}
.hybrid-spec-icon {
  width: 20px;
  height: 20px;
  color: #38bdf8;
  flex-shrink: 0;
  margin-top: 2px;
}
.hybrid-spec-text strong {
  color: #ffffff;
  display: block;
  font-size: 0.92rem;
}
.hybrid-spec-text span {
  color: #94a3b8;
  font-size: 0.8rem;
}
.hybrid-bottom-bar {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}
.hybrid-meta-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.84rem;
  color: #cbd5e1;
}
@media (max-width: 900px) {
  .hybrid-profile-split {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .hybrid-creator-side {
    padding-right: 0;
  }
}
@media (max-width: 600px) {
  .hybrid-container {
    margin-top: -55px;
    padding: 0 14px;
  }
  .hybrid-main-card {
    padding: 20px 16px;
  }
  .hybrid-avatar-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .hybrid-avatar {
    width: 86px;
    height: 86px;
    margin-top: -43px;
  }
  .hybrid-bottom-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .hybrid-bottom-bar .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
`;

// Helper: SVG Verified checkmark
const verifiedSvg = `
<svg class="verified-check-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" title="Verified Local Business Owner">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

// ============================================================
// BUILD VERSION 1: LinkedIn-Style Professional Contractor Profile
// ============================================================
function buildVersion1() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-1">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 1: LinkedIn Pro Profile] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(1)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="concept2-hero-wrap" id="hero">
      <!-- COVER BANNER (M&M Fleet in Pacific Northwest) -->
      <div class="pro-cover-wrap">
        <img class="pro-cover-img" 
             src="/assets/images/team-hero.webp" 
             alt="M&amp;M Commercial Rig &amp; Team Fleet" 
             width="1920" height="1080" 
             fetchpriority="high">
        <div class="pro-cover-gradient"></div>
      </div>

      <!-- LINKEDIN PROFESSIONAL PROFILE CONTAINER -->
      <div class="linkedin-container">
        <div class="linkedin-card">
          
          <div class="linkedin-header-row">
            <div class="linkedin-identity">
              <img class="linkedin-avatar" 
                   src="/assets/images/martin-silchuk-avatar.webp" 
                   alt="Martin Silchuk - Founder &amp; Principal Operator" 
                   width="120" height="120">
              <div class="linkedin-name-title">
                <h1 class="linkedin-name">
                  Martin Silchuk
                  ${verifiedSvg}
                </h1>
                <p class="linkedin-headline">
                  Founder &amp; Principal Operator • Commercial &amp; Residential Hauling Specialist
                </p>
                <p class="linkedin-subline">
                  Federal Way, WA • Serving 35-Mile Radius across 13 Postal Zones • <strong>258+ Verified Client Recommendations (5.0 ★)</strong>
                </p>
              </div>
            </div>

            <!-- LinkedIn Action Buttons -->
            <div class="linkedin-action-bar">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book Online in 30 Sec (AMZY) ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--md" aria-label="Call Martin Silchuk directly">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Direct Call: (253) 886-7724
              </a>
            </div>
          </div>

          <!-- VERIFIED CREDENTIALS & VEHICLE SPEC GRID -->
          <div class="linkedin-credentials-grid">
            <div class="linkedin-cred-item">
              <svg class="linkedin-cred-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
              <div>
                <div class="linkedin-cred-title">Commercial Rig Verified</div>
                <div class="linkedin-cred-val">2019 Isuzu NPR</div>
                <div class="linkedin-cred-detail">16-Ft Heavy Duty Box • Hydraulic Lift</div>
              </div>
            </div>

            <div class="linkedin-cred-item">
              <svg class="linkedin-cred-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              <div>
                <div class="linkedin-cred-title">Operational Territory</div>
                <div class="linkedin-cred-val">35-Mile Active Radius</div>
                <div class="linkedin-cred-detail">13 Serviced Postal Zones in Pierce/King</div>
              </div>
            </div>

            <div class="linkedin-cred-item">
              <svg class="linkedin-cred-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              <div>
                <div class="linkedin-cred-title">Licensing &amp; Bonding</div>
                <div class="linkedin-cred-val">WA Active UBI &amp; Insured</div>
                <div class="linkedin-cred-detail">BBB AAA+ Rating • 19 Yrs Experience</div>
              </div>
            </div>

            <div class="linkedin-cred-item">
              <svg class="linkedin-cred-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <div>
                <div class="linkedin-cred-title">Pricing &amp; Guarantee</div>
                <div class="linkedin-cred-val">10% Rate Beat Guarantee</div>
                <div class="linkedin-cred-detail">Zero Franchise Royalties or Markups</div>
              </div>
            </div>
          </div>

          <!-- ABOUT / FOUNDER PLEDGE -->
          <div class="linkedin-about-box">
            <div class="linkedin-about-heading">
              About Martin Silchuk &amp; M&amp;M Junk Removal
            </div>
            <p class="linkedin-about-text">
              "We Haul Junk to the Dump" — Operating since 2007, I personally manage all field operations with our dedicated 2019 Isuzu NPR commercial rig. Unlike national franchise haulers that add 20% to 40% in royalty fees and route you to an out-of-state call center, you speak directly with me. Upfront flat rates, licensed eco-sorting, and guaranteed 10% lower pricing than any licensed competitor.
            </p>
          </div>

        </div>
      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// ============================================================
// BUILD VERSION 2: Social Resume & Operator Dossier
// ============================================================
function buildVersion2() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-2">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 2: Social Resume Dossier] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(2)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="resume-hero-wrap" id="hero">
      <div class="container">
        
        <!-- OPERATOR DOSSIER CARD -->
        <div class="resume-dossier-card">
          
          <!-- TOP TELEMETRY STRIP -->
          <div class="resume-top-telemetry">
            <div class="resume-telemetry-tag">
              <span class="live-pulse"></span>
              <span>LIVE DISPATCH STATUS: ACTIVE TODAY</span>
            </div>
            <div style="font-size: 0.84rem; color: #94a3b8; font-weight: 600;">
              Operational Territory: <span style="color: #ffffff;">Pierce &amp; South King County</span> (35-Mile Radius)
            </div>
          </div>

          <!-- HEADER PROFILE BLOCK -->
          <div class="resume-header-grid">
            <div class="resume-avatar-wrap">
              <img class="resume-avatar-img" 
                   src="/assets/images/martin-silchuk-avatar.webp" 
                   alt="Martin Silchuk Operator Profile" 
                   width="100" height="100">
              <div style="position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px; background: #22c55e; border: 3px solid #111827; border-radius: 50%;" class="pulse-online"></div>
            </div>

            <div class="resume-name-block">
              <h1>
                Martin Silchuk
                ${verifiedSvg}
              </h1>
              <p class="resume-title-role">
                Owner-Operator &amp; Lead Dispatcher • M&amp;M Junk Removal LLC
              </p>
              <p class="resume-location-contact">
                <span>📍 Federal Way Headquarters</span>
                <span>•</span>
                <span>📞 Direct Line: <strong style="color: #ffffff;">(253) 886-7724</strong></span>
                <span>•</span>
                <span>⭐ 5.0 Rating (258 Verified Reviews)</span>
              </p>
            </div>

            <div class="resume-header-actions">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book in 30 Sec (AMZY) ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--md">
                Call Martin Directly
              </a>
            </div>
          </div>

          <!-- 4 TECHNICAL METRIC CARDS -->
          <div class="resume-metrics-quad">
            <div class="resume-metric-card">
              <div class="resume-metric-icon">🚛</div>
              <div class="resume-metric-title">Commercial Rig</div>
              <div class="resume-metric-val">2019 Isuzu NPR</div>
              <div class="resume-metric-sub">Commercial 16-ft box truck with hydraulic lift for high-capacity hauls.</div>
            </div>

            <div class="resume-metric-card">
              <div class="resume-metric-icon">📍</div>
              <div class="resume-metric-title">Operating Radius</div>
              <div class="resume-metric-val">35-Mile Radar</div>
              <div class="resume-metric-sub">Serving 13 Postal Zones in Pierce and South King County with fast dispatch.</div>
            </div>

            <div class="resume-metric-card">
              <div class="resume-metric-icon">🏆</div>
              <div class="resume-metric-title">Track Record</div>
              <div class="resume-metric-val">19+ Years In WA</div>
              <div class="resume-metric-sub">Privately founded in 2007. BBB AAA+ accredited and zero franchise fees.</div>
            </div>

            <div class="resume-metric-card">
              <div class="resume-metric-icon">⭐</div>
              <div class="resume-metric-title">Proven Reputation</div>
              <div class="resume-metric-val">258+ Reviews</div>
              <div class="resume-metric-sub">5.0 Star average across 234 Google and 24 Yelp customer reviews.</div>
            </div>
          </div>

          <!-- CORE COMPETENCIES & GUARANTEE -->
          <div class="resume-skills-row">
            <span style="font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-right: 4px;">Service Scope:</span>
            <span class="resume-skill-badge resume-skill-badge--active">10% Rate Beat Guarantee</span>
            <span class="resume-skill-badge">Estate &amp; Whole-Home Cleanouts</span>
            <span class="resume-skill-badge">Commercial Appliance Removal</span>
            <span class="resume-skill-badge">Light Demolition &amp; Shed Teardown</span>
            <span class="resume-skill-badge">Yard Waste &amp; Construction Debris</span>
            <span class="resume-skill-badge">WA UBI Active &amp; Insured</span>
          </div>

        </div>

      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// ============================================================
// BUILD VERSION 3: Hybrid Social & Verified Fleet Bridge
// ============================================================
function buildVersion3() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-3">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 3: Hybrid Fleet Bridge] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(3)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="hybrid-hero-wrap" id="hero">
      <!-- COVER BANNER (Truck Fleet & Mt Rainier Pacific Northwest Backdrop) -->
      <div class="pro-cover-wrap">
        <img class="pro-cover-img" 
             src="/assets/images/team-hero.webp" 
             alt="M&amp;M Junk Removal Fleet Cover Banner" 
             width="1920" height="1080" 
             fetchpriority="high">
        <div class="pro-cover-gradient"></div>
      </div>

      <!-- HYBRID SOCIAL PROFILE & RIG DECK -->
      <div class="hybrid-container">
        <div class="hybrid-main-card">
          
          <div class="hybrid-profile-split">
            
            <!-- LEFT: Social Creator & Owner Profile -->
            <div class="hybrid-creator-side">
              <div class="hybrid-avatar-row">
                <img class="hybrid-avatar" 
                     src="/assets/images/martin-silchuk-avatar.webp" 
                     alt="Martin Silchuk Profile Picture" 
                     width="110" height="110">
                <div>
                  <h1 class="hybrid-author-name">
                    Martin Silchuk
                    ${verifiedSvg}
                  </h1>
                  <p class="hybrid-handle-tag">
                    @mmjunk • Founder &amp; Operator • Est. 2007
                  </p>
                </div>
              </div>

              <p class="hybrid-bio">
                <strong>"We Haul Junk to the Dump"</strong> — Fast, friendly, and honest junk removal. When you contact us, you deal directly with me. No franchise middleman, no surprise surcharges, and we match &amp; beat any licensed competitor's price by 10%!
              </p>

              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px;">
                <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                  Book Online in 30 Sec (AMZY) ↗
                </a>
                <a href="tel:2538867724" class="btn btn--outline-light btn--md">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  (253) 886-7724
                </a>
              </div>
            </div>

            <!-- RIGHT: Verified Fleet & Dispatch Deck -->
            <div class="hybrid-fleet-deck">
              <div class="hybrid-deck-header">
                <span class="hybrid-deck-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                  Verified Commercial Equipment &amp; Territory
                </span>
                <span class="live-pulse"></span>
              </div>

              <div class="hybrid-spec-item">
                <svg class="hybrid-spec-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                <div class="hybrid-spec-text">
                  <strong>Commercial Rig: 2019 Isuzu NPR</strong>
                  <span>16-Ft heavy box with hydraulic equipment for large-scale removals.</span>
                </div>
              </div>

              <div class="hybrid-spec-item">
                <svg class="hybrid-spec-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                <div class="hybrid-spec-text">
                  <strong>Operational Territory: 35-Mile Radius</strong>
                  <span>Active dispatch across 13 Postal Zones in Pierce &amp; South King County.</span>
                </div>
              </div>

              <div class="hybrid-spec-item">
                <svg class="hybrid-spec-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <div class="hybrid-spec-text">
                  <strong>Client Rating: 5.0 ★ (258+ Reviews)</strong>
                  <span>Verified feedback across Google (234) and Yelp (24).</span>
                </div>
              </div>
            </div>

          </div>

          <!-- BOTTOM SOCIAL FOOTER BAR -->
          <div class="hybrid-bottom-bar">
            <div class="hybrid-meta-pills">
              <span>🛡️ <strong>WA Active UBI &amp; Insured</strong></span>
              <span>•</span>
              <span>💰 <strong>10% Price Beat Guarantee</strong></span>
              <span>•</span>
              <span>⚡ <strong>Same-Day Trucks on Standby</strong></span>
            </div>
            <a href="#reviews" class="btn btn--outline-light btn--sm">
              Read 258 Customer Reviews ↓
            </a>
          </div>

        </div>
      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// Build and save each version
const v1 = buildVersion1();
const v2 = buildVersion2();
const v3 = buildVersion3();

// Write to both root and public directories
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

console.log('All 3 evolved preview pages built successfully!');
