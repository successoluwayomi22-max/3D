/**
 * Custom Fluid Magnetic Glow Cursor
 * Provides a responsive cursor dot and a smooth trailing magnetic ring.
 */
export function initMagneticCursor(audioManager) {
  // Only enable on desktop pointer devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';
  document.body.appendChild(dot);

  const ring = document.createElement('div');
  ring.className = 'custom-cursor-ring';
  document.body.appendChild(ring);

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isHovered = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }, { passive: true });

  // Attach magnetic hover events to interactive targets
  function bindHoverTargets() {
    const targets = document.querySelectorAll('button, a, .pillar-card, .story-card, .form-input, .form-select');
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        isHovered = true;
        ring.classList.add('cursor-hover');
        if (audioManager) audioManager.playHoverSound();
      });
      el.addEventListener('mouseleave', () => {
        isHovered = false;
        ring.classList.remove('cursor-hover');
      });
      el.addEventListener('click', () => {
        ring.classList.add('cursor-click');
        setTimeout(() => ring.classList.remove('cursor-click'), 250);
        if (audioManager) audioManager.playClickSound();
      });
    });
  }

  bindHoverTargets();

  // Smooth render loop for trailing ring
  function render() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${isHovered ? 1.6 : 1})`;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
