document.addEventListener('DOMContentLoaded', function () {
  // Initialize all components
  initSectionAnimations();
  initSmoothScrolling();
  initBackToTopButton();
  initFormValidation();
  initTestimonialCarousel();
  initParticleBackground();
  initCounterAnimations();

  // Elements for testimonial carousel
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const indicators = document.querySelectorAll('.indicator');
  const prevButton = document.querySelector('.prev-button');
  const nextButton = document.querySelector('.next-button');
  const testimonialGrid = document.querySelector('.testimonial-grid');

  // Set up carousel mode for mobile
  function setupCarouselMode() {
    if (window.innerWidth <= 768) {
      testimonialGrid.setAttribute('data-mode', 'carousel');
      showTestimonial(currentIndex);
    } else {
      testimonialGrid.removeAttribute('data-mode');
      testimonialCards.forEach(card => {
        card.classList.remove('active');
        card.style.display = '';
      });
    }
  }

  // Initial setup for testimonial carousel
  let currentIndex = 0;
  if (testimonialGrid) {
    setupCarouselMode();
  }

  // Handle window resize
  window.addEventListener('resize', function () {
    if (testimonialGrid) {
      setupCarouselMode();
    }
  });

  // Show specific testimonial
  function showTestimonial(index) {
    if (!testimonialGrid || testimonialGrid.getAttribute('data-mode') !== 'carousel') return;

    testimonialCards.forEach((card, i) => {
      card.classList.remove('active', 'slide-in', 'slide-out');
      card.style.display = 'none';
    });

    testimonialCards[index].style.display = 'flex';
    testimonialCards[index].classList.add('active', 'slide-in');

    // Update indicators
    if (indicators) {
      indicators.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }
  }

  // Next testimonial
  function nextTestimonial() {
    if (!testimonialCards.length) return;
    currentIndex = (currentIndex + 1) % testimonialCards.length;
    showTestimonial(currentIndex);
  }

  // Previous testimonial
  function prevTestimonial() {
    if (!testimonialCards.length) return;
    currentIndex = (currentIndex - 1 + testimonialCards.length) % testimonialCards.length;
    showTestimonial(currentIndex);
  }

  // Event listeners for testimonial navigation
  if (nextButton) {
    nextButton.addEventListener('click', nextTestimonial);
  }

  if (prevButton) {
    prevButton.addEventListener('click', prevTestimonial);
  }

  if (indicators) {
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        showTestimonial(currentIndex);
      });
    });
  }

  // Add hover effects to cards
  if (testimonialCards) {
    testimonialCards.forEach(card => {
      card.addEventListener('mouseenter', function () {
        // Add any additional hover effects here
        const highlight = this.querySelector('.highlight');
        if (highlight) {
          highlight.style.background = 'linear-gradient(transparent 50%, rgba(26, 115, 232, 0.3) 50%)';
        }
      });

      card.addEventListener('mouseleave', function () {
        // Reset hover effects
        const highlight = this.querySelector('.highlight');
        if (highlight) {
          highlight.style.background = 'linear-gradient(transparent 60%, rgba(26, 115, 232, 0.2) 40%)';
        }
      });
    });
  }

  // Auto-scroll for carousel mode (optional)
  let autoScrollInterval;

  function startAutoScroll() {
    if (testimonialGrid && testimonialGrid.getAttribute('data-mode') === 'carousel') {
      autoScrollInterval = setInterval(nextTestimonial, 5000);
    }
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }

  // Start auto-scroll if testimonial grid exists
  if (testimonialGrid) {
    startAutoScroll();

    // Pause auto-scroll on hover
    testimonialGrid.addEventListener('mouseenter', stopAutoScroll);
    testimonialGrid.addEventListener('mouseleave', startAutoScroll);
  }

  // Stop auto-scroll when user interacts with controls
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      stopAutoScroll();
      setTimeout(startAutoScroll, 10000);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      stopAutoScroll();
      setTimeout(startAutoScroll, 10000);
    });
  }

  if (indicators) {
    indicators.forEach(indicator => {
      indicator.addEventListener('click', () => {
        stopAutoScroll();
        setTimeout(startAutoScroll, 10000);
      });
    });
  }

  // Add accessibility features
  if (testimonialCards) {
    testimonialCards.forEach((card, index) => {
      card.setAttribute('aria-label', `Testimonial ${index + 1}`);
      card.setAttribute('tabindex', '0');
    });
  }

  // Add scroll reveal animation
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  if (testimonialCards) {
    testimonialCards.forEach(card => {
      observer.observe(card);
    });
  }

  // Simulate AOS library behavior
  const animateElements = document.querySelectorAll('[data-aos]');

  const aosObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-aos-delay') || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, delay);
      }
    });
  }, { threshold: 0.1 });

  animateElements.forEach(element => {
    aosObserver.observe(element);
  });
});

/**
 * Section Animations - Animate sections as they come into view
 */
function initSectionAnimations() {
  const sections = document.querySelectorAll('.partner-section');

  // Immediately show the first section
  if (sections.length > 0) {
    setTimeout(() => {
      sections[0].classList.add('visible');
    }, 100);
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);

        // Animate child elements with staggered delay
        const animatableElements = entry.target.querySelectorAll('.partner-card, .testimonial-card');
        animatableElements.forEach((el, index) => {
          setTimeout(() => {
            el.classList.add('animate-in');
          }, 150 * index);
        });
      }
    });
  }, observerOptions);

  // Start observing all sections except the first one (which is shown immediately)
  sections.forEach((section, index) => {
    if (index > 0) {
      sectionObserver.observe(section);
    } else {
      // For the first section, still animate the cards
      const animatableElements = section.querySelectorAll('.partner-card, .testimonial-card');
      animatableElements.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('animate-in');
        }, 300 + (150 * i)); // Slight delay after section becomes visible
      });
    }
  });

  // NEW CODE: Add specific observer for who-section
  const whoSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
      }
    });
  }, { threshold: 0.1 });

  const whoSection = document.querySelector('.who-section');
  if (whoSection) {
    whoSectionObserver.observe(whoSection);
  }

  // Add CSS for animations
  const style = document.createElement('style');
  style.innerHTML = `
    .partner-card, .testimonial-card {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .partner-card.animate-in, .testimonial-card.animate-in {
      opacity: 1;
      transform: translateY(0);
    }
    
    header.scrolled {
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
    }
    
    /* AOS Animation Styles */
    [data-aos] {
      opacity: 0;
      transition-property: opacity, transform;
      transition-duration: 0.8s;
      transition-timing-function: ease;
    }
    
    [data-aos].aos-animate {
      opacity: 1;
      transform: translateY(0) translateX(0) scale(1) rotate(0);
    }
    
    [data-aos="fade-up"] {
      transform: translateY(20px);
    }
    
    [data-aos="fade-down"] {
      transform: translateY(-20px);
    }
    
    [data-aos="fade-right"] {
      transform: translateX(-20px);
    }
    
    [data-aos="fade-left"] {
      transform: translateX(20px);
    }
    
    [data-aos="zoom-in"] {
      transform: scale(0.9);
    }
    
    [data-aos="flip-up"] {
      transform: rotateX(-20deg);
    }
    
    /* NEW STYLES: Animation for who-section */
    .who-section {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    .who-section.reveal {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Smooth Scrolling for all internal links
 */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      // Close mobile menu if open
      const mobileNav = document.querySelector('.mobile-nav-open');
      if (mobileNav) {
        mobileNav.classList.remove('mobile-nav-open');
      }

      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

      window.scrollTo({
        top: targetPosition - headerHeight - 20,
        behavior: 'smooth'
      });
    });
  });
}

/**
 * Back to Top Button functionality
 */
function initBackToTopButton() {
  const backToTopBtn = document.getElementById('backToTop');

  if (!backToTopBtn) {
    console.warn('Back to top button not found in the DOM');
    return;
  }

  // Hide button initially
  backToTopBtn.style.opacity = '0';
  backToTopBtn.style.visibility = 'hidden';
  backToTopBtn.style.transition = 'opacity 0.3s, visibility 0.3s';
  backToTopBtn.style.position = 'fixed';
  backToTopBtn.style.bottom = '20px';
  backToTopBtn.style.right = '20px';
  backToTopBtn.style.zIndex = '99';

  window.addEventListener('scroll', function () {
    if (window.pageYOffset > 300) {
      backToTopBtn.style.opacity = '1';
      backToTopBtn.style.visibility = 'visible';
    } else {
      backToTopBtn.style.opacity = '0';
      backToTopBtn.style.visibility = 'hidden';
    }
  });

  backToTopBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Form Validation for the partnership form
 */
function initFormValidation() {
  const form = document.getElementById('partnershipForm');

  if (!form) {
    console.warn('Partnership form not found in the DOM');
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (validateForm(form)) {
      // Show loading state
      const submitBtn = document.getElementById('submitBtn');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Simulate form submission (replace with actual API call)
      setTimeout(() => {
        showFormSuccess();
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        form.reset();
      }, 1500);
    }
  });

  // Live validation for inputs
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', function () {
      validateInput(this);
    });

    // Remove error styling when user starts typing again
    input.addEventListener('input', function () {
      if (this.classList.contains('error')) {
        this.classList.remove('error');
        const errorMsg = this.parentNode.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    });
  });

  // Add CSS for error state
  const style = document.createElement('style');
  style.innerHTML = `
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
      border-color: #e53935;
      box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
    }
    
    .error-message {
      color: #e53935;
      font-size: 12px;
      margin-top: 5px;
      display: block;
    }
    
    .success-message {
      background: var(--primary-gradient);
      color: white;
      padding: 20px;
      border-radius: var(--radius);
      text-align: center;
      margin-bottom: 20px;
      animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      margin-top: 5px;
    }
    
    .checkbox-group label {
      display: flex;
      align-items: center;
      margin: 5px 0;
      font-weight: normal;
    }
    
    .checkbox-group input[type="checkbox"] {
      width: auto;
      margin-right: 8px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Form validation helper functions
 */
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');

  requiredFields.forEach(field => {
    if (!validateInput(field)) {
      isValid = false;
    }
  });

  // Additional validation for email format
  const emailField = form.querySelector('input[type="email"]');
  if (emailField && emailField.value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailField.value)) {
      showError(emailField, 'Please enter a valid email address');
      isValid = false;
    }
  }

  return isValid;
}

function validateInput(input) {
  // Clear previous error
  const existingError = input.parentNode.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  input.classList.remove('error');

  // Check if field is required and empty
  if (input.hasAttribute('required') && !input.value.trim()) {
    showError(input, 'This field is required');
    return false;
  }

  return true;
}

function showError(input, message) {
  input.classList.add('error');
  const errorElement = document.createElement('span');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  input.parentNode.appendChild(errorElement);

  // Make sure the input is in view
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFormSuccess() {
  const form = document.getElementById('partnershipForm');
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message';
  successMessage.innerHTML = `
    <h3>Thank You for Your Interest!</h3>
    <p>We've received your partnership inquiry and will get back to you within 48 hours.</p>
  `;

  // Insert before the form
  form.parentNode.insertBefore(successMessage, form);

  // Scroll to success message
  successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Remove the message after some time
  setTimeout(() => {
    successMessage.style.opacity = '0';
    successMessage.style.transform = 'translateY(-10px)';
    successMessage.style.transition = 'opacity 0.5s, transform 0.5s';

    setTimeout(() => {
      successMessage.remove();
    }, 500);
  }, 5000);
}

/**
 * Testimonial Carousel - Auto-scrolling testimonials
 */
function initTestimonialCarousel() {
  const testimonialSection = document.querySelector('.testimonial-section');
  if (!testimonialSection) return;

  const testimonials = document.querySelectorAll('.testimonial-card');

  if (testimonials.length <= 3) {
    return; // No need for carousel functionality if 3 or fewer testimonials
  }

  // Create carousel container
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'testimonial-carousel-wrapper';

  // Create carousel controls
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';
  controls.innerHTML = `
    <button class="carousel-prev" aria-label="Previous testimonial">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <div class="carousel-dots"></div>
    <button class="carousel-next" aria-label="Next testimonial">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  // Replace the testimonial grid with our carousel
  const testimonialGrid = document.querySelector('.testimonial-grid');
  if (!testimonialGrid) return;

  testimonialGrid.parentNode.replaceChild(carouselWrapper, testimonialGrid);
  carouselWrapper.appendChild(testimonialGrid);
  carouselWrapper.appendChild(controls);

  // Add dots for each testimonial
  const dotsContainer = controls.querySelector('.carousel-dots');
  testimonials.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Testimonial ${index + 1}`);
    if (index === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });

  // Set up carousel functionality
  let currentIndex = 0;
  const dots = dotsContainer.querySelectorAll('.carousel-dot');

  function showTestimonial(index) {
    // Handle index boundaries
    if (index < 0) index = testimonials.length - 1;
    if (index >= testimonials.length) index = 0;

    // Update current index
    currentIndex = index;

    // Update active dot
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });

    // Calculate translation
    const offset = -100 * currentIndex;
    testimonialGrid.style.transform = `translateX(${offset}%)`;
  }

  // Event listeners for controls
  controls.querySelector('.carousel-prev').addEventListener('click', () => {
    showTestimonial(currentIndex - 1);
  });

  controls.querySelector('.carousel-next').addEventListener('click', () => {
    showTestimonial(currentIndex + 1);
  });

  // Event listeners for dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showTestimonial(index);
    });
  });

  // Auto-advance carousel
  let carouselInterval = setInterval(() => {
    showTestimonial(currentIndex + 1);
  }, 5000);

  // Pause auto-advance on hover or focus
  carouselWrapper.addEventListener('mouseenter', () => {
    clearInterval(carouselInterval);
  });

  carouselWrapper.addEventListener('mouseleave', () => {
    carouselInterval = setInterval(() => {
      showTestimonial(currentIndex + 1);
    }, 5000);
  });

  // Add CSS for carousel
  const style = document.createElement('style');
  style.innerHTML = `
    .testimonial-carousel-wrapper {
      position: relative;
      overflow: hidden;
      margin-top: 40px;
    }
    
    .testimonial-grid {
      display: flex;
      transition: transform 0.5s ease;
    }
    
    .testimonial-card {
      flex: 0 0 100%;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .carousel-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 30px;
    }
    
    .carousel-prev, .carousel-next {
      background: white;
      border: var(--border);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .carousel-prev:hover, .carousel-next:hover {
      background: var(--primary);
      color: white;
    }
    
    .carousel-prev svg, .carousel-next svg {
      width: 20px;
      height: 20px;
    }
    
    .carousel-dots {
      display: flex;
      gap: 8px;
      margin: 0 15px;
    }
    
    .carousel-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--gray-light);
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .carousel-dot.active {
      background: var(--primary);
      transform: scale(1.2);
    }
    
    @media (min-width: 768px) {
      .testimonial-card {
        flex: 0 0 33.333%;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Particle Background for the hero section
 */
function initParticleBackground() {
  const heroSection = document.querySelector('.partner-hero');

  if (!heroSection) return;

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.className = 'particle-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1';

  // Insert before the overlay
  const heroOverlay = heroSection.querySelector('.hero-overlay');
  if (heroOverlay) {
    heroSection.insertBefore(canvas, heroOverlay);
  } else {
    heroSection.appendChild(canvas);
  }

  // Set canvas dimensions
  canvas.width = heroSection.offsetWidth;
  canvas.height = heroSection.offsetHeight;

  // Get context
  const ctx = canvas.getContext('2d');

  // Create particles
  const particles = [];
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      color: 'rgba(255, 255, 255, ' + (Math.random() * 0.3 + 0.2) + ')',
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25
    });
  }

  // Animation function
  function animateParticles() {
    requestAnimationFrame(animateParticles);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
      // Move particle
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      // Connect nearby particles
      connectParticles(particle);
    });
  }

  function connectParticles(p) {
    particles.forEach(particle => {
      const distance = Math.sqrt(
        Math.pow(p.x - particle.x, 2) +
        Math.pow(p.y - particle.y, 2)
      );

      if (distance < 100) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.2 - distance / 500) + ')';
        ctx.lineWidth = 0.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
      }
    });
  }

  // Handle window resize
  window.addEventListener('resize', function () {
    canvas.width = heroSection.offsetWidth;
    canvas.height = heroSection.offsetHeight;
  });

  // Start animation
  animateParticles();
}

/**
 * Counter animations for impact statistics
 */
function initCounterAnimations() {
  // Add a stats section if it doesn't exist yet
  if (!document.querySelector('.stats-section')) {
    createStatsSection();
  }

  const counters = document.querySelectorAll('.counter');

  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = Math.max(1, Math.floor(target / (duration / 16))); // Update every ~16ms (60fps)

        let current = 0;
        const timer = setInterval(() => {
          current += step;
          counter.textContent = current.toLocaleString();

          if (current >= target) {
            counter.textContent = target.toLocaleString();
            clearInterval(timer);
          }
        }, 16);

        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

/**
 * Create a statistics section to showcase impact
 */
function createStatsSection() {
  const introSection = document.getElementById('intro');

  if (!introSection) return;

  const statsSection = document.createElement('section');
  statsSection.className = 'partner-section stats-section';
  statsSection.innerHTML = `
    <div class="number-header">
      <div class="number-badge">Our Impact</div>
      <h2>DIAPS By The Numbers</h2>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value"><span class="counter" data-target="12500">0</span>+</div>
        <div class="stat-label">Disaster Events Monitored</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><span class="counter" data-target="150">0</span></div>
        <div class="stat-label">Countries Covered</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><span class="counter" data-target="65">0</span>+</div>
        <div class="stat-label">Partner Organizations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><span class="counter" data-target="2500000">0</span>+</div>
        <div class="stat-label">People Protected</div>
      </div>
    </div>
  `;

  // Insert after intro section
  introSection.parentNode.insertBefore(statsSection, introSection.nextSibling);

  // Add CSS for stats section
  const style = document.createElement('style');
  style.innerHTML = `
    .stats-section {
      margin: 60px 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }
    
    .stat-card {
      background: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 25px 20px;
      text-align: center;
      transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-value {
      font-size: 42px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 10px;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      font-size: 16px;
      color: var(--gray);
    }
  `;
  document.head.appendChild(style);
}

// Create mobile nav functionality if needed
if (!document.querySelector('.mobile-nav-toggle')) {
  // Check if we need to add mobile nav (based on screen width)
  if (window.innerWidth < 768) {
    createMobileNav();
  }

  // Handle resize events
  window.addEventListener('resize', function () {
    if (window.innerWidth < 768 && !document.querySelector('.mobile-nav-toggle')) {
      createMobileNav();
    }
  });
}

/**
 * Create mobile navigation for smaller screens
 */
function createMobileNav() {
  const header = document.querySelector('header');
  const mainNav = document.querySelector('.main-nav');

  if (!header || !mainNav) return;

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'mobile-nav-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-icon">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close-icon">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Insert before main nav
  header.querySelector('.header-container').appendChild(toggleBtn);

  // Add event listener
  toggleBtn.addEventListener('click', function () {
    document.body.classList.toggle('mobile-nav-open');
  });


  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('mobile-nav-open') &&
      !e.target.closest('.main-nav') &&
      !e.target.closest('.mobile-nav-toggle')) {
      document.body.classList.remove('mobile-nav-open');
    }
  });


  const style = document.createElement('style');
  style.innerHTML = `
    .mobile-nav-toggle {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 5px;
    }
    
    .mobile-nav-toggle svg {
      width: 28px;
      height: 28px;
      transition: transform 0.3s ease;
    }
    
    .mobile-nav-toggle .close-icon {
      display: none;
    }
    
    @media (max-width: 768px) {
      .mobile-nav-toggle {
        display: block;
      }
      
      .main-nav {
        position: fixed;
        top: 70px;
        left: 0;
        width: 100%;
        background: white;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 20px;
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
        z-index: 999;
      }
      
      .main-nav ul {
        flex-direction: column;
      }
      
      .main-nav li {
        margin: 15px 0;
      }
      
      body.mobile-nav-open .main-nav {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }
      
      body.mobile-nav-open .mobile-nav-toggle .menu-icon {
        display: none;
      }
      
      body.mobile-nav-open .mobile-nav-toggle .close-icon {
        display: block;
      }
    }
  `;
  document.head.appendChild(style);
}