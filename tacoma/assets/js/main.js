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
});
