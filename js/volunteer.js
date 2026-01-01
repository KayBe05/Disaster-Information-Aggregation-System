document.addEventListener('DOMContentLoaded', function () {
  // Initialize all components
  initializeAnimations();
  initializeScrollEffects();
  initializeFormValidation();
  initializeSmoothScrolling();
  initializeCardInteractions();
  initializeLoadingScreen();
});


function initializeLoadingScreen() {
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loading);

  // Hide loading screen after page loads
  window.addEventListener('load', function () {
    setTimeout(function () {
      loading.classList.add('hidden');
      setTimeout(function () {
        loading.remove();
      }, 500);
    }, 800);
  });
}


function initializeAnimations() {
  // Initial animations that should be visible on page load
  document.querySelectorAll('.fade-in-up.active').forEach(element => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  });

  // Staggered animations for grid items
  const staggeredElements = document.querySelectorAll('.stagger-delay > *');
  staggeredElements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('active');
    }, 100 * (index + 1));
  });
}

/**
 * Initialize scroll-based animations
 */
function initializeScrollEffects() {
  // Elements to observe for scroll animations
  const elements = document.querySelectorAll('.fade-in-up:not(.active)');

  // Create intersection observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Stop observing after animation
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  });

  // Observe all elements
  elements.forEach(element => {
    observer.observe(element);
  });

  // Handle data-scroll elements
  const scrollElements = document.querySelectorAll('[data-scroll]');

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-scroll', 'in');
      } else {
        const direction = entry.boundingClientRect.top > 0 ? 'up' : 'down';
        entry.target.setAttribute('data-scroll', direction);
      }
    });
  }, {
    root: null,
    rootMargin: '-10% 0px',
    threshold: 0.1
  });

  scrollElements.forEach(element => {
    scrollObserver.observe(element);
  });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      window.scrollTo({
        top: targetElement.offsetTop - 80, // Accounting for header
        behavior: 'smooth'
      });

      // Update URL without reloading page
      history.pushState(null, null, targetId);
    });
  });
}

/**
 * Initialize volunteer card interactions
 */
function initializeCardInteractions() {
  const cards = document.querySelectorAll('.volunteer-card, .impact-card');

  cards.forEach(card => {
    // Add 3D tilt effect on mouse move
    card.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    // Reset transform on mouse leave
    card.addEventListener('mouseleave', function () {
      this.style.transform = '';
      setTimeout(() => {
        this.style.transition = 'transform 0.5s ease';
      }, 100);
    });

    // Remove transition on mouse enter for smooth movement
    card.addEventListener('mouseenter', function () {
      this.style.transition = 'transform 0.1s ease';
    });
  });

  // Add pulsing animation for impact numbers when they come into view
  const impactNumbers = document.querySelectorAll('.impact-number');
  const impactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        impactObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  impactNumbers.forEach(number => {
    impactObserver.observe(number);
  });
}

/**
 * Animate count up for impact numbers
 */
function animateCountUp(element) {
  const target = element.innerText;
  const targetNumber = parseInt(target.replace(/[^0-9]/g, ''));
  const suffix = target.replace(/[0-9]/g, '');
  let count = 0;
  const duration = 1500; // milliseconds
  const frameDuration = 1000 / 60; // 60fps
  const totalFrames = Math.round(duration / frameDuration);
  const increment = targetNumber / totalFrames;

  const timer = setInterval(() => {
    count += increment;
    if (count >= targetNumber) {
      element.innerText = target;
      clearInterval(timer);
    } else {
      element.innerText = Math.floor(count) + suffix;
    }
  }, frameDuration);
}

/**
 * Initialize form validation and submission
 */
function initializeFormValidation() {
  const form = document.getElementById('volunteerForm');
  const successMessage = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate form
    if (!validateForm(form)) {
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    submitButton.disabled = true;

    // Create the data object from the form
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Send data to a backend endpoint (or a service like Formspree/EmailJS)
    fetch('https://api.diaps.org/api/volunteer', { // Replace with your actual endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (response.ok) {
          // Success handling
          form.style.display = 'none';
          successMessage.style.display = 'block';
          form.reset();
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
          successMessage.scrollIntoView({ behavior: 'smooth' });
        } else {
          throw new Error('Network response was not ok.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        submitButton.innerHTML = 'Error. Try Again.';
        submitButton.disabled = false;
      });


  });

  // Add real-time validation feedback
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    // Validate on blur
    input.addEventListener('blur', function () {
      validateInput(this);
    });

    // Remove error styling on focus
    input.addEventListener('focus', function () {
      this.classList.remove('error');
      const errorElement = this.parentElement.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    });
  });
}

function validateInput(input) {
  // Remove any existing error messages
  const existingError = input.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  let isValid = true;
  let errorMessage = '';

  // Check if required field is empty
  if (input.hasAttribute('required') && !input.value.trim()) {
    isValid = false;
    errorMessage = 'This field is required';
  }

  // Email validation
  if (input.type === 'email' && input.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
  }

  // Phone validation (if provided)
  if (input.type === 'tel' && input.value) {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }
  }

  // Show/hide error message
  if (!isValid) {
    input.classList.add('error');
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = errorMessage;
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    input.parentElement.appendChild(errorElement);
  } else {
    input.classList.remove('error');
  }

  return isValid;
}

/**
 * Validate the entire form
 */
function validateForm(form) {
  const inputs = form.querySelectorAll('input, textarea, select');
  let isValid = true;

  inputs.forEach(input => {
    if (!validateInput(input)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Add custom styling for form elements
 */
function enhanceFormStyling() {
  // Add custom styling for select dropdowns
  document.querySelectorAll('select').forEach(select => {
    // Style wrapper
    select.parentElement.style.position = 'relative';

    // Add dropdown arrow
    const arrow = document.createElement('div');
    arrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    arrow.style.position = 'absolute';
    arrow.style.right = '15px';
    arrow.style.top = '50%';
    arrow.style.transform = 'translateY(-50%)';
    arrow.style.pointerEvents = 'none';
    arrow.style.color = '#666';

    // Append after the select
    select.parentElement.appendChild(arrow);
  });
}

/**
 * Add parallax effect to background elements
 */
function initializeParallaxEffect() {
  window.addEventListener('scroll', function () {
    const scrollPosition = window.pageYOffset;

    // Parallax for header elements
    const headerElements = document.querySelectorAll('.volunteer-header::before, .volunteer-header::after');
    headerElements.forEach(element => {
      const speed = 0.5;
      element.style.transform = `translateY(${scrollPosition * speed}px)`;
    });

    // Parallax for background dots
    document.body.style.backgroundPosition = `0 ${scrollPosition * 0.2}px`;
  });
}

// Call additional enhancement functions
window.addEventListener('load', function () {
  enhanceFormStyling();
  initializeParallaxEffect();

  // Add custom cursor effect
  addCustomCursorEffect();

  // Initialize newsletter form
  initializeNewsletterForm();

  // Initialize footer animations
  initializeFooterAnimations();

  // Initialize mobile menu
  initializeMobileMenu();
});

/**
 * Add custom cursor effect on interactive elements
 */
function addCustomCursorEffect() {
  // Create custom cursor element
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.style.position = 'fixed';
  cursor.style.width = '20px';
  cursor.style.height = '20px';
  cursor.style.borderRadius = '50%';
  cursor.style.backgroundColor = 'rgba(26, 115, 232, 0.2)';
  cursor.style.pointerEvents = 'none';
  cursor.style.transform = 'translate(-50%, -50%)';
  cursor.style.zIndex = '9999';
  cursor.style.transition = 'transform 0.1s ease, background-color 0.3s ease';
  document.body.appendChild(cursor);

  // Update cursor position
  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Scale cursor on interactive elements
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, .volunteer-card, .impact-card');
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', function () {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursor.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
      cursor.style.mixBlendMode = 'multiply';
    });

    element.addEventListener('mouseleave', function () {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.backgroundColor = 'rgba(26, 115, 232, 0.2)';
      cursor.style.mixBlendMode = 'normal';
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', function () {
    cursor.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function () {
    cursor.style.opacity = '1';
  });

  // Add custom cursor styling for mobile
  if (window.matchMedia('(max-width: 768px)').matches) {
    cursor.style.display = 'none';
  }
}

/**
 * Initialize newsletter form functionality
 */
function initializeNewsletterForm() {
  const newsletterForm = document.querySelector('.newsletter-form');

  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const emailInput = this.querySelector('input[type="email"]');

    if (!emailInput || !emailInput.value.trim()) {
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      // Show error
      const errorMsg = document.createElement('p');
      errorMsg.textContent = 'Please enter a valid email address';
      errorMsg.style.color = '#e74c3c';
      errorMsg.style.fontSize = '0.85rem';
      errorMsg.style.margin = '5px 0 0';
      errorMsg.className = 'newsletter-error';

      // Remove any existing error
      const existingError = newsletterForm.querySelector('.newsletter-error');
      if (existingError) {
        existingError.remove();
      }

      newsletterForm.appendChild(errorMsg);
      return;
    }

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.innerHTML = '<span class="loading-spinner"></span>';
    submitButton.disabled = true;

    // Remove any existing messages
    const existingMessages = newsletterForm.querySelectorAll('.newsletter-error, .newsletter-success');
    existingMessages.forEach(msg => msg.remove());

    // Simulate API call for subscription
    setTimeout(() => {
      // Show success message
      const successMsg = document.createElement('p');
      successMsg.textContent = 'Thank you for subscribing!';
      successMsg.style.color = '#2ecc71';
      successMsg.style.fontSize = '0.9rem';
      successMsg.style.margin = '5px 0 0';
      successMsg.className = 'newsletter-success';

      newsletterForm.appendChild(successMsg);

      // Reset form and button
      emailInput.value = '';
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;

      // Remove success message after some time
      setTimeout(() => {
        const msg = newsletterForm.querySelector('.newsletter-success');
        if (msg) {
          msg.style.opacity = '0';
          setTimeout(() => msg.remove(), 500);
        }
      }, 3000);
    }, 1000);
  });
}

/**
 * Initialize footer animations
 */
function initializeFooterAnimations() {
  const footerAnimateElements = document.querySelectorAll('.footer-animate');

  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('footer-animate-active');
        footerObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });

  footerAnimateElements.forEach(element => {
    footerObserver.observe(element);
    // Add staggered animation delay
    const index = Array.from(footerAnimateElements).indexOf(element);
    element.style.transitionDelay = `${index * 0.1}s`;
  });

  // Add CSS for footer animations
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .footer-animate {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .footer-animate-active {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
  const header = document.querySelector('header');

  if (!header) return;

  // Create mobile menu button
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.setAttribute('aria-label', 'Toggle Menu');
  mobileMenuBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-icon">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close-icon">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Only add if not already there and if we're on mobile
  if (window.matchMedia('(max-width: 768px)').matches) {
    const existingBtn = header.querySelector('.mobile-menu-btn');

    if (!existingBtn) {
      // Add button to header
      const headerContainer = header.querySelector('.header-container');
      headerContainer.appendChild(mobileMenuBtn);

      // Add CSS for mobile menu
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @media (max-width: 768px) {
          .header-container {
            position: relative;
          }
          
          .mobile-menu-btn {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: currentColor;
            cursor: pointer;
            z-index: 1000;
          }
          
          .mobile-menu-btn .close-icon {
            display: none;
          }
          
          .mobile-menu-btn.active .menu-icon {
            display: none;
          }
          
          .mobile-menu-btn.active .close-icon {
            display: block;
          }
          
          .main-nav {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background-color: rgba(255, 255, 255, 0.95);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .main-nav.active {
            transform: translateX(0);
          }
          
          .main-nav ul {
            flex-direction: column;
            text-align: center;
          }
          
          .main-nav ul li {
            margin: 15px 0;
            font-size: 1.2rem;
          }
        }
      `;
      document.head.appendChild(styleElement);

      // Toggle menu
      mobileMenuBtn.addEventListener('click', function () {
        const nav = document.querySelector('.main-nav');
        this.classList.toggle('active');
        nav.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (nav.classList.contains('active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });

      // Close menu when clicking a link
      const navLinks = document.querySelectorAll('.main-nav a');
      navLinks.forEach(link => {
        link.addEventListener('click', function () {
          const nav = document.querySelector('.main-nav');
          const menuBtn = document.querySelector('.mobile-menu-btn');

          nav.classList.remove('active');
          menuBtn.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }
  }
}

// Add CSS for error styling
const styleElement = document.createElement('style');
styleElement.textContent = `
  input.error, select.error, textarea.error {
    border-color: #e74c3c !important;
    background-color: rgba(231, 76, 60, 0.05) !important;
  }
  
  .form-group {
    position: relative;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s ease-in-out infinite;
    margin-right: 5px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 0.5s ease;
  }
  
  .loading.hidden {
    opacity: 0;
    pointer-events: none;
  }
  
  .loading .loading-spinner {
    width: 40px;
    height: 40px;
    border-width: 3px;
    border-top-color: #1a73e8;
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
document.head.appendChild(styleElement);

// Add accessibility improvements
function enhanceAccessibility() {
  // Add keyboard focus styles
  const accessibilityStyle = document.createElement('style');
  accessibilityStyle.textContent = `
    a:focus, button:focus, input:focus, select:focus, textarea:focus {
      outline: 2px solid #1a73e8;
      outline-offset: 2px;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #1a73e8;
      color: white;
      padding: 8px;
      z-index: 10000;
      transition: top 0.3s ease;
    }
    
    .skip-link:focus {
      top: 0;
    }
  `;
  document.head.appendChild(accessibilityStyle);

  // Add skip link for screen readers
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.prepend(skipLink);

  // Ensure all interactive elements are properly focusable
  document.querySelectorAll('.volunteer-card, .impact-card').forEach(card => {
    if (!card.getAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
  });

  // Add appropriate ARIA labels to icons
  document.querySelectorAll('svg').forEach(svg => {
    const parentEl = svg.parentElement;
    if (parentEl && !parentEl.getAttribute('aria-label')) {
      // Try to find text within the parent or its sibling
      const siblingText = parentEl.nextElementSibling?.textContent?.trim();
      const childText = parentEl.querySelector('h2, h3, h4')?.textContent?.trim();

      if (siblingText) {
        parentEl.setAttribute('aria-label', siblingText);
      } else if (childText) {
        parentEl.setAttribute('aria-label', childText);
      }
    }
  });
}

// Call accessibility enhancements
window.addEventListener('load', enhanceAccessibility);