/**
 * M&M Junk Removal - Production Frontend Script & AMZY Dispatch Engine
 * Handles FAQ accordion, video lazy loading, AMZY volume qualification, reviews display
 */

// Google Ads conversion tracking function
function gtag_report_conversion(url) {
  var callback = function () {
    if (typeof(url) !== 'undefined') {
      window.location = url;
    }
  };
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', {
      'send_to': 'AW-1064983468/urRRCJDHq6obEKy36fsD',
      'event_callback': callback
    });
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. FAQ Accordion (Pure CSS transition without forced synchronous reflow)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other accordions
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });

        // Toggle current accordion
        if (!isActive) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });

  // 2. Reviews Show More / Toggle (Progressive Disclosure - Clean crawlability without display:none)
  const toggleReviewsBtn = document.getElementById('toggle-reviews-btn');
  const extraReviewsGrid = document.getElementById('extra-reviews');

  if (toggleReviewsBtn && extraReviewsGrid) {
    toggleReviewsBtn.addEventListener('click', () => {
      const isExpanded = toggleReviewsBtn.getAttribute('data-expanded') === 'true';

      if (!isExpanded) {
        extraReviewsGrid.classList.add('is-expanded');
        extraReviewsGrid.setAttribute('aria-hidden', 'false');
        toggleReviewsBtn.textContent = 'Show Fewer Reviews';
        toggleReviewsBtn.setAttribute('data-expanded', 'true');
        toggleReviewsBtn.setAttribute('aria-expanded', 'true');
      } else {
        extraReviewsGrid.classList.remove('is-expanded');
        extraReviewsGrid.setAttribute('aria-hidden', 'true');
        toggleReviewsBtn.textContent = 'View All 20 Recent Verified Reviews';
        toggleReviewsBtn.setAttribute('data-expanded', 'false');
        toggleReviewsBtn.setAttribute('aria-expanded', 'false');

        // Scroll back to reviews header
        const reviewsSection = document.getElementById('reviews');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // 3. Lazy Load YouTube iframes when near viewport
  const videoWrappers = document.querySelectorAll('.video-wrapper[data-video-id]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const wrapper = entry.target;
          const videoId = wrapper.getAttribute('data-video-id');
          if (videoId && !wrapper.querySelector('iframe')) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
            iframe.title = 'M&M Junk Removal Customer Review Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.loading = 'lazy';
            wrapper.appendChild(iframe);
          }
          obs.unobserve(wrapper);
        }
      });
    }, { rootMargin: '200px' });

    videoWrappers.forEach(w => observer.observe(w));
  } else {
    // Fallback
    videoWrappers.forEach(wrapper => {
      const videoId = wrapper.getAttribute('data-video-id');
      if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        wrapper.appendChild(iframe);
      }
    });
  }

  // 4. Multi-Step Quote & AMZY Intake Engine
  const intakeForm = document.getElementById('quote-intake-form');
  if (intakeForm) {
    const steps = intakeForm.querySelectorAll('.intake-step');
    const progressBar = intakeForm.querySelector('.intake-progress-bar');
    const stepBadge = intakeForm.querySelector('.intake-header__step-badge');
    const prevBtn = intakeForm.querySelector('#intake-prev-btn');
    const nextBtn = intakeForm.querySelector('#intake-next-btn');
    const submitBtn = intakeForm.querySelector('#intake-submit-btn');
    const zipInput = intakeForm.querySelector('#intake-zip');
    const zipStatus = intakeForm.querySelector('#zip-validation-status');
    const fileInput = intakeForm.querySelector('#intake-photos');
    const dropzone = intakeForm.querySelector('#photo-dropzone');
    const dropzoneText = intakeForm.querySelector('#dropzone-file-name');

    let currentStep = 1;
    const totalSteps = steps.length;

    // Authorized 25 Service Municipalities in King & Pierce County:
    // Federal Way, Auburn, Des Moines, Kent, Milton, Pacific, Algona, Covington,
    // Maple Valley, Normandy Park, Renton, SeaTac, Tukwila, Bonney Lake, Edgewood,
    // Fife, Fircrest, Gig Harbor, Lakewood, Puyallup, Ruston, Sumner, Tacoma,
    // University Place, South Seattle.
    const validZipCodes = new Set([
      // Federal Way
      '98003', '98023', '98063', '98093',
      // Auburn, Algona, Pacific
      '98001', '98002', '98047', '98092',
      // Des Moines, Normandy Park, SeaTac
      '98198', '98166', '98148', '98158', '98188',
      // Kent, Covington, Maple Valley
      '98030', '98031', '98032', '98042', '98064', '98038',
      // Renton, Tukwila, South Seattle
      '98055', '98056', '98057', '98058', '98059', '98168', '98178', '98108', '98118', '98106', '98126', '98146',
      // Milton, Edgewood, Puyallup, Sumner, Bonney Lake
      '98354', '98371', '98372', '98373', '98374', '98375', '98390', '98391',
      // Tacoma, Fife, Fircrest, Ruston, University Place, Lakewood
      '98402', '98403', '98404', '98405', '98406', '98407', '98408', '98409',
      '98418', '98421', '98422', '98424', '98444', '98445', '98465', '98466',
      '98467', '98498', '98499',
      // Gig Harbor
      '98329', '98332', '98335'
    ]);

    // AMZY Pricing Matrix lookup
    const pricingMatrix = {
      'mini': {
        name: 'MINI (Minimum Load)',
        range: '$95 - $140',
        desc: 'Minimum load, single item or few bags'
      },
      '1_pickup': {
        name: '1 Pick Up Truck Load',
        range: '$140 - $230',
        desc: 'Standard pickup truck capacity (~4x8 bed)'
      },
      '2_pickup': {
        name: '2 Pick Up Loads',
        range: '$230 - $415',
        desc: 'Double pickup truck capacity'
      },
      'dump_truck': {
        name: 'Dump Truck Load',
        range: '$740 - $1,110',
        desc: 'Full dump truck capacity'
      },
      'dump_truck_plus': {
        name: 'Dump Truck Plus',
        range: '$1,110 - $1,480',
        desc: 'Exceeds one dump truck capacity'
      }
    };

    function updateStepUI() {
      steps.forEach((step, index) => {
        if (index + 1 === currentStep) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      // Update progress
      const percent = (currentStep / totalSteps) * 100;
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (stepBadge) stepBadge.textContent = `Step ${currentStep} of ${totalSteps}`;

      // Navigation buttons
      if (prevBtn) {
        prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
      }

      if (currentStep === totalSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
      } else {
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
      }
    }

    // ZIP Code Validation Check
    function validateZip(zip) {
      const cleanZip = (zip || '').trim().substring(0, 5);
      if (cleanZip.length === 5) {
        if (validZipCodes.has(cleanZip)) {
          if (zipStatus) {
            zipStatus.textContent = '✓ Verified Service Area: Same-Day Dispatch Available!';
            zipStatus.className = 'zip-status valid';
          }
          return true;
        } else {
          if (zipStatus) {
            zipStatus.textContent = '⚠️ I apologize, but M&M Junk Removal currently only serves: Federal Way, Auburn, Des Moines, Kent, Milton, Pacific, Algona, Covington, Maple Valley, Normandy Park, Renton, SeaTac, Tukwila, Bonney Lake, Edgewood, Fife, Fircrest, Gig Harbor, Lakewood, Puyallup, Ruston, Sumner, Tacoma, University Place, and South Seattle. Because ' + cleanZip + ' is outside our service area, we cannot fulfill this request.';
            zipStatus.className = 'zip-status invalid';
          }
          return false;
        }
      } else {
        if (zipStatus) {
          zipStatus.textContent = 'Enter your 5-digit King or Pierce County ZIP code.';
          zipStatus.className = 'zip-status';
        }
        return false;
      }
    }

    if (zipInput) {
      zipInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 5) {
          validateZip(val);
        }
      });
    }

    // Dynamic Volume Estimation Selection
    const volumeRadios = intakeForm.querySelectorAll('input[name="volume_tier"]');
    const dynamicEstimateBox = document.getElementById('dynamic-estimate-box');
    const dynamicPriceTag = document.getElementById('dynamic-price-tag');

    function updateVolumeEstimate() {
      const selected = intakeForm.querySelector('input[name="volume_tier"]:checked');
      if (selected && pricingMatrix[selected.value]) {
        const tier = pricingMatrix[selected.value];
        if (dynamicPriceTag) {
          dynamicPriceTag.textContent = `${tier.range} (${tier.name})`;
        }
        if (dynamicEstimateBox) {
          dynamicEstimateBox.style.display = 'block';
        }
      }
    }

    volumeRadios.forEach(radio => {
      radio.addEventListener('change', updateVolumeEstimate);
    });

    // Dropzone handling
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          handleFiles(fileInput.files);
        }
      });

      fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
      });

      function handleFiles(files) {
        if (files && files.length > 0) {
          const names = Array.from(files).map(f => f.name).join(', ');
          if (dropzoneText) {
            dropzoneText.textContent = `Attached: ${names}`;
            dropzoneText.style.color = '#ea580c';
            dropzoneText.style.fontWeight = 'bold';
          }
        }
      }
    }

    // Next step navigation
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        // Step 1 Validation (ZIP)
        if (currentStep === 1) {
          const zip = zipInput ? zipInput.value.trim() : '';
          if (zip.length < 5) {
            alert('Please enter your 5-digit ZIP code to confirm dispatch coverage.');
            if (zipInput) zipInput.focus();
            return;
          }
          if (!validZipCodes.has(zip.substring(0, 5))) {
            const proceedAnyway = confirm('Note: Your ZIP code appears outside our 25 primary service cities in King and Pierce County. Would you like to submit for special route review?');
            if (!proceedAnyway) return;
          }
        }

        // Step 2 Validation (at least one scope item selected)
        if (currentStep === 2) {
          const checked = intakeForm.querySelectorAll('input[name="scope"]:checked');
          if (checked.length === 0) {
            alert('Please select at least one item category you need removed.');
            return;
          }
        }

        // Step 3 Validation (Volume tier)
        if (currentStep === 3) {
          const volChecked = intakeForm.querySelector('input[name="volume_tier"]:checked');
          if (!volChecked) {
            alert('Please select an approximate load size based on our pickup truck guide.');
            return;
          }
        }

        if (currentStep < totalSteps) {
          currentStep++;
          updateStepUI();
        }
      });
    }

    // Prev step navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
          currentStep--;
          updateStepUI();
        }
      });
    }

    // Submit handler
    intakeForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (intakeForm.querySelector('#intake-name')?.value || '').trim();
      const phone = (intakeForm.querySelector('#intake-phone')?.value || '').trim();
      const zip = zipInput ? zipInput.value.trim() : '';
      const selectedVol = intakeForm.querySelector('input[name="volume_tier"]:checked')?.value || '1_pickup';
      const tierInfo = pricingMatrix[selectedVol] || pricingMatrix['1_pickup'];

      if (!name || !phone) {
        alert('Please provide your name and a valid phone number for quote dispatch.');
        return;
      }

      // Track conversion in Google Ads
      gtag_report_conversion();

      // Show immediate confirmation in UI with AMZY handoff
      const container = intakeForm.closest('.intake-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 25px 12px;">
            <div style="font-size: 42px; color: #16a34a; margin-bottom: 8px;">✓</div>
            <h3 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Ballpark Estimate Generated!</h3>
            
            <div style="background: #f8fafc; border: 2px dashed #ea580c; border-radius: 10px; padding: 16px; margin: 16px 0; text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Qualified Volume Tier:</span>
                <span style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">${tierInfo.name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Ballpark Price Range:</span>
                <span style="font-size: 1.25rem; font-weight: 900; color: #ea580c;">${tierInfo.range}</span>
              </div>
              <p style="font-size: 0.82rem; color: #64748b; line-height: 1.4; border-top: 1px solid #e2e8f0; padding-top: 8px; margin: 0; font-style: italic;">
                *Disclaimer: This is NOT a final quote, but an approximate ballpark estimate. Exact prices require an on-site visual inspection.
              </p>
            </div>

            <p style="color: #475569; font-size: 0.92rem; line-height: 1.5; margin-bottom: 16px;">
              Thank you, <strong>${name}</strong>! Your request for <strong>ZIP ${zip}</strong> has been logged. To view live availability and secure your spot on our dispatch calendar right now:
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--lg" style="width: 100%; justify-content: center;">
                👉 Complete Booking via AMZY Calendar
              </a>
              <a href="tel:2538867724" class="btn btn--outline-dark btn--md" style="width: 100%; justify-content: center;">
                📞 Call Dispatch: (253) 886-7724
              </a>
            </div>

            <div style="font-size: 0.78rem; color: #94a3b8; line-height: 1.4;">
              🔒 <strong>Privacy Assurance:</strong> Your data is used strictly for logistics and scheduling purposes. We never sell your data.
            </div>
          </div>
        `;
      }
    });

    // Initialize UI
    updateStepUI();
  }

  // 5. Interactive Service Category Filter Engine
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const serviceCards = document.querySelectorAll('.service-card[data-category]');
  const serviceSilos = document.querySelectorAll('.service-silo[data-category]');
  const materialsGuide = document.getElementById('materials-guide');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Update active class & ARIA
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Filter cards and silos
        if (filter === 'all') {
          serviceCards.forEach(c => c.style.display = 'flex');
          serviceSilos.forEach(s => s.style.display = 'block');
          if (materialsGuide) materialsGuide.style.display = 'block';
        } else if (filter === 'materials') {
          serviceCards.forEach(c => c.style.display = 'none');
          serviceSilos.forEach(s => s.style.display = 'none');
          if (materialsGuide) {
            materialsGuide.style.display = 'block';
            materialsGuide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          if (materialsGuide) materialsGuide.style.display = 'none';

          serviceCards.forEach(c => {
            const categories = c.getAttribute('data-category').split(' ');
            if (categories.includes(filter)) {
              c.style.display = 'flex';
            } else {
              c.style.display = 'none';
            }
          });

          serviceSilos.forEach(s => {
            const siloCat = s.getAttribute('data-category');
            if (siloCat === filter || (filter === 'appliances' && siloCat === 'residential') || (filter === 'demolition' && siloCat === 'commercial')) {
              s.style.display = 'block';
            } else {
              s.style.display = 'none';
            }
          });
        }
      });
    });
  }
});

