/**
 * Accessible home-banner carousel for wallBoard.
 *
 * The first slide is visible in HTML without JavaScript. Enhanced behavior
 * includes timed changes, navigation dots, buttons, pause, and touch swipes.
 * The timer is suspended whenever auto-rotation would be distracting.
 */

const SLIDE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 45;

export function initializeHeroSlider() {
  const carousel = document.querySelector('[data-hero-carousel]');

  if (!carousel) {
    return;
  }

  const viewport = carousel.querySelector('.hero-carousel__viewport');
  const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
  const nextButton = carousel.querySelector('[data-hero-next]');
  const previousButton = carousel.querySelector('[data-hero-prev]');
  const pauseButton = carousel.querySelector('[data-hero-pause]');
  const counter = carousel.querySelector('[data-hero-counter]');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!viewport || slides.length < 2 || dots.length !== slides.length) {
    return;
  }

  let activeIndex = 0;
  let manuallyPaused = false;
  let pointerStartX = null;
  let intervalId = null;

  function canAutoplay() {
    return !manuallyPaused
      && !motionQuery.matches
      && !document.hidden
      && !carousel.matches(':hover')
      && !carousel.contains(document.activeElement);
  }

  function stopTimer() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function formatCount(index) {
    return String(index + 1).padStart(2, '0').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);
  }

  function showSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.hidden = !active;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle('is-active', active);

      if (active) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (counter) {
      counter.textContent = `${formatCount(activeIndex)} / ${formatCount(slides.length - 1)}`;
    }
  }

  function startTimer() {
    stopTimer();

    if (canAutoplay()) {
      intervalId = window.setInterval(() => {
        if (canAutoplay()) {
          showSlide(activeIndex + 1);
        } else {
          stopTimer();
        }
      }, SLIDE_INTERVAL_MS);
    }
  }

  function navigate(delta) {
    showSlide(activeIndex + delta);
    startTimer();
  }

  nextButton?.addEventListener('click', () => navigate(1));
  previousButton?.addEventListener('click', () => navigate(-1));

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startTimer();
    });
  });

  pauseButton?.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    pauseButton.setAttribute('aria-pressed', String(manuallyPaused));
    pauseButton.setAttribute(
      'aria-label',
      manuallyPaused ? 'از سرگیری پخش خودکار' : 'توقف پخش خودکار',
    );
    pauseButton.textContent = manuallyPaused ? '▶' : 'Ⅱ';
    startTimer();
  });

  carousel.addEventListener('mouseenter', stopTimer);
  carousel.addEventListener('mouseleave', startTimer);
  carousel.addEventListener('focusin', stopTimer);
  carousel.addEventListener('focusout', () => {
    // The focusout fires before activeElement is updated. A microtask sees
    // the new focus target and doesn't restart the timer mid-interaction.
    queueMicrotask(startTimer);
  });

  viewport.addEventListener('touchstart', (event) => {
    pointerStartX = event.touches[0]?.clientX ?? null;
  }, { passive: true });

  viewport.addEventListener('touchend', (event) => {
    if (pointerStartX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? pointerStartX;
    const distance = endX - pointerStartX;
    pointerStartX = null;

    if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) {
      navigate(distance > 0 ? 1 : -1);
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', startTimer);
  motionQuery.addEventListener?.('change', startTimer);

  showSlide(0);
  startTimer();
}
