const fs = require('fs');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Remove A/B Experiment Engine script
  const abScriptPattern = /<!-- A\/B Experiment Engine[\s\S]*?<\/script>\s*/;
  if (!abScriptPattern.test(html)) {
    console.warn('Could not find A/B engine script in', filePath);
  }
  html = html.replace(abScriptPattern, '');

  // 2. Replace style#hero-ab-styles with clean hero-styles
  const stylePattern = /<style id="hero-ab-styles">[\s\S]*?<\/style>/;
  const newStyle = `<style id="hero-styles">
    /* Verified checkmark SVG icon */
    .verified-check-svg {
      display: inline-block;
      vertical-align: middle;
      color: #38bdf8;
      flex-shrink: 0;
    }

    /* Clean Social Profile Hero Styles */
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
    .social-clean-cover-picture,
    .social-clean-cover-picture img,
    .social-clean-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.8;
      display: block;
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
      padding: 28px 32px 32px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05);
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
    .social-clean-location-radius {
      font-size: 0.95rem;
      color: #cbd5e1;
      font-weight: 500;
      margin: 6px 0 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
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
      margin: 0;
      max-width: 950px;
    }
    .social-clean-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .social-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .social-badge svg {
      color: #ea580c;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .social-clean-container {
        margin-top: -55px;
        padding: 0 14px;
      }
      .social-clean-card {
        padding: 22px 18px 24px;
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
      .social-clean-badges {
        gap: 8px;
        margin-top: 14px;
      }
      .social-badge {
        font-size: 0.78rem;
        padding: 5px 10px;
      }
    }
  </style>`;
  if (!stylePattern.test(html)) {
    console.warn('Could not find hero-ab-styles in', filePath);
  }
  html = html.replace(stylePattern, newStyle);

  // 3. Remove A/B telemetry events and trackHeroConversion function
  const telemetryPattern = /\/\/ 50\/50 A\/B Test Telemetry[\s\S]*?function trackHeroConversion[\s\S]*?catch \(e\) \{\s*console\.error\('Error tracking hero conversion:', e\);\s*\}\s*\}/;
  if (!telemetryPattern.test(html)) {
    console.warn('Could not find telemetry / trackHeroConversion pattern in', filePath);
  }
  html = html.replace(telemetryPattern, '');

  // 4. Replace both hero sections with single canonical Social Profile Hero
  const heroSectionsPattern = /<!-- =+\s*HERO VARIANT A: CLASSIC CONTROL\s*=+\s*-->[\s\S]*?<!-- =+\s*HERO VARIANT B: SOCIAL PROFILE[^\n]*\s*=+\s*-->[\s\S]*?<\/section>/;
  
  const singleSocialHero = `<!-- ============================================================
         HERO SECTION: SOCIAL PROFILE (Owner Operator)
         ============================================================ -->
    <section class="social-clean-hero" id="hero">
      <!-- Panoramic Cover Banner -->
      <div class="social-clean-cover">
        <picture class="social-clean-cover-picture">
          <source media="(max-width: 768px)" srcset="assets/images/team-hero-mobile.webp" width="320" height="426">
          <img src="assets/images/team-hero.webp" 
               alt="M&amp;M Junk Removal Fleet Cover Banner in Pierce &amp; South King County" 
               width="1920" height="1080" 
               fetchpriority="high" decoding="sync">
        </picture>
        <div class="social-clean-cover-overlay"></div>
      </div>

      <!-- Social Profile Container -->
      <div class="social-clean-container">
        <div class="social-clean-card">
          
          <!-- Top Row: Avatar + Name + Action Buttons -->
          <div class="social-clean-top">
            <div class="social-clean-identity">
              <img class="social-clean-avatar" 
                   src="/assets/images/martin-silchuk-avatar.webp" 
                   alt="Martin Silchuk - Owner Operator" 
                   width="114" height="114">
              <div class="social-clean-name-block">
                <div class="social-clean-name">
                  <span>Martin Silchuk</span>
                  <svg class="verified-check-svg" width="20" height="20" viewBox="0 0 24 24" fill="#38bdf8" title="Verified Owner &amp; Operator">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p class="social-clean-location-radius">
                  <strong style="color: #ffffff; font-weight: 700;">Owner Operator</strong>
                  <span style="color: #64748b;">•</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ea580c" style="flex-shrink:0;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                  <span>Based in Federal Way, WA</span>
                  <span style="color: #64748b;">•</span>
                  <span>Serving 25 Authorized Communities in South King &amp; Pierce County</span>
                </p>
              </div>
            </div>

            <!-- Direct Booking & Phone Actions -->
            <div class="social-clean-actions">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book Online via AMZY in 30 Sec ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--md" aria-label="Call (253) 886-7724 for rapid dispatch">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Call Dispatch: (253) 886-7724
              </a>
            </div>
          </div>

          <!-- PRIMARY CANONICAL H1 HEADLINE -->
          <h1 class="social-clean-h1">
            Fast, Friendly &amp; Fair-Priced Junk Removal in <span>Pierce &amp; South King County</span>
          </h1>

          <!-- VALUE PROPOSITION DESCRIPTION -->
          <p class="social-clean-desc">
            "We Haul Junk to the Dump" — Direct owner-operator service with Martin Silchuk. Save 10% compared to corporate franchises with upfront volume flat rates, same-day dispatch, zero hidden fees, and certified eco-sorting across 25 local communities.
          </p>

          <!-- TRUST & CREDENTIAL BADGES -->
          <div class="social-clean-badges">
            <div class="social-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              Licensed &amp; Insured (WA UBI 604-676-011 Active)
            </div>
            <div class="social-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              Privately Owned (Founded 2007)
            </div>
            <div class="social-badge">
              <span style="font-weight:900; color:#ea580c;">10%</span>
              Rate Guarantee
            </div>
          </div>

        </div>
      </div>
    </section>`;

  if (!heroSectionsPattern.test(html)) {
    console.warn('Could not find hero sections pattern in', filePath);
  }
  html = html.replace(heroSectionsPattern, singleSocialHero);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Successfully updated', filePath);
}

updateFile('index.html');
updateFile('public/index.html');
