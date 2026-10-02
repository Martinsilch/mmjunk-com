/**
 * M&M Junk Removal - Production Frontend Script
 * Handles FAQ accordion, video lazy loading, conversion tracking, reviews display
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
  // 1. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close other accordions
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current accordion
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      }
    });
  });

  // Open the first FAQ item by default
  if (faqItems.length > 0) {
    faqItems[0].classList.add('active');
    const firstAnswer = faqItems[0].querySelector('.faq-answer');
    if (firstAnswer) firstAnswer.style.maxHeight = firstAnswer.scrollHeight + 'px';
  }

  // 2. Reviews Show More / Toggle
  const toggleReviewsBtn = document.getElementById('toggle-reviews-btn');
  const hiddenReviews = document.querySelectorAll('.review-card.review--hidden');

  if (toggleReviewsBtn && hiddenReviews.length > 0) {
    toggleReviewsBtn.addEventListener('click', () => {
      const isExpanded = toggleReviewsBtn.getAttribute('data-expanded') === 'true';

      if (!isExpanded) {
        hiddenReviews.forEach(r => r.style.display = 'flex');
        toggleReviewsBtn.textContent = 'Show Fewer Reviews';
        toggleReviewsBtn.setAttribute('data-expanded', 'true');
      } else {
        hiddenReviews.forEach(r => r.style.display = 'none');
        toggleReviewsBtn.textContent = `View All 26 Verified Customer Reviews`;
        toggleReviewsBtn.setAttribute('data-expanded', 'false');

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

  // 4. Multi-Step Quote & Booking Intake Engine
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

    // Verified South King & Pierce County ZIP codes (15-mile operating radius)
    const validZipCodes = new Set([
      '98001', '98002', '98003', '98023', '98030', '98031', '98032', '98042',
      '98047', '98092', '98198', '98354', '98371', '98372', '98373', '98374',
      '98375', '98390', '98391', '98402', '98403', '98404', '98405', '98406',
      '98407', '98408', '98409', '98418', '98421', '98422', '98424', '98444',
      '98445', '98465', '98466', '98498', '98499'
    ]);

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
            zipStatus.textContent = '📍 Near our zone: We review custom dispatch within Pierce & King Counties.';
            zipStatus.className = 'zip-status valid';
          }
          return true;
        }
      } else {
        if (zipStatus) {
          zipStatus.textContent = 'Please enter a 5-digit ZIP code.';
          zipStatus.className = 'zip-status invalid';
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
        // Step 1 Validation
        if (currentStep === 1) {
          const zip = zipInput ? zipInput.value.trim() : '';
          if (zip.length < 5) {
            alert('Please enter your 5-digit ZIP code to confirm dispatch coverage.');
            if (zipInput) zipInput.focus();
            return;
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
      const email = (intakeForm.querySelector('#intake-email')?.value || '').trim();

      if (!name || !phone) {
        alert('Please provide your name and a valid phone number for quote dispatch.');
        return;
      }

      // Track conversion in Google Ads
      gtag_report_conversion();

      // Show immediate confirmation in UI
      const container = intakeForm.closest('.intake-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px 10px;">
            <div style="font-size: 48px; color: #16a34a; margin-bottom: 12px;">✓</div>
            <h3 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Quote Request Received!</h3>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">
              Thank you, <strong>${name}</strong>! Our dispatch manager is reviewing your items for <strong>ZIP ${zipInput ? zipInput.value : ''}</strong>. We will text or call you at <strong>${phone}</strong> with your guaranteed quote within 15 minutes.
            </p>
            <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
              <p style="font-weight: 700; color: #ea580c; font-size: 0.9rem; margin-bottom: 4px;">Need Immediate Same-Day Pickup?</p>
              <a href="tel:2538867724" class="btn btn--primary btn--sm" style="display: inline-flex; margin-top: 6px;">
                Call Priority Dispatch: (253) 886-7724
              </a>
            </div>
            <a href="https://amzy.me/?utm_content=4" class="btn btn--outline-dark btn--sm" target="_blank" rel="noopener noreferrer">
              Or Choose Self-Schedule Time Window &rarr;
            </a>
          </div>
        `;
      }
    });

    // Initialize UI
    updateStepUI();
  }
});

