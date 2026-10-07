/**
 * 3D Interactive Card Tilt with Specular Glare
 * Adds authentic agency-style physical depth on hover.
 */
export function initCardTilt() {
  const cards = document.querySelectorAll('.pillar-card, .story-card, .admissions-box');

  cards.forEach(card => {
    let bounds;

    function onMouseEnter() {
      bounds = card.getBoundingClientRect();
    }

    function onMouseMove(e) {
      if (!bounds) bounds = card.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const xPct = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
      const yPct = (mouseY / bounds.height - 0.5) * 2;

      // Subtle, elegant tilt angles
      const rotX = -yPct * 8; // Max 8 deg
      const rotY = xPct * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`;
      card.style.setProperty('--glare-x', `${(mouseX / bounds.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(mouseY / bounds.height * 100).toFixed(1)}%`);
    }

    function onMouseLeave() {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      card.style.setProperty('--glare-x', '50%');
      card.style.setProperty('--glare-y', '50%');
    }

    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  });
}
