import './style.css';
import confetti from 'canvas-confetti';
import { CampusSceneController } from './three/sceneController.js';
import { AcademyAudioManager } from './components/audioManager.js';
import { ScrollytellingManager } from './scrollytelling.js';
import { initMagneticCursor } from './components/cursor.js';
import { initCardTilt } from './components/tilt.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize WebGL Three.js Controller
  const webglContainer = document.getElementById('webgl-container');
  const sceneController = new CampusSceneController(webglContainer);

  // 2. Initialize Ambient Audio Manager
  const audioManager = new AcademyAudioManager();

  // 3. Initialize Scrollytelling Manager
  const scrollytelling = new ScrollytellingManager(sceneController, audioManager);

  // 4. Initialize Fluid Magnetic Cursor & 3D Interactive Card Tilt
  initMagneticCursor(audioManager);
  initCardTilt();

  // 4. Handle Tour Booking Form Submission
  const tourForm = document.getElementById('tour-booking-form');
  if (tourForm) {
    tourForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const studentName = document.getElementById('student-name').value;
      const grade = document.getElementById('grade-level').value;
      const email = document.getElementById('parent-email').value;
      const tourDate = document.getElementById('tour-date').value;

      // Confetti explosion
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#e6b743', '#ffffff', '#005277']
      });

      // Update button state
      const submitBtn = document.getElementById('submit-tour-btn');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <span>✓ Tour Booked for ${studentName || 'Student'}!</span>
      `;
      submitBtn.style.background = 'linear-gradient(135deg, #00e5ff 0%, #00a3cc 100%)';
      submitBtn.style.color = '#060b17';

      setTimeout(() => {
        alert(`Congratulations! A confirmation prospectus and campus tour itinerary for ${studentName} (Grade ${grade}) has been scheduled for ${tourDate}. Confirmation sent to ${email}.`);
        tourForm.reset();
        submitBtn.innerHTML = originalHTML;
        submitBtn.style.background = '';
        submitBtn.style.color = '';
      }, 700);
    });
  }

  // Set default tour date to 2 weeks from today
  const tourDateInput = document.getElementById('tour-date');
  if (tourDateInput) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    tourDateInput.value = defaultDate.toISOString().split('T')[0];
    tourDateInput.min = new Date().toISOString().split('T')[0];
  }

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  console.log('Spring of Success Academy 3D Scrollytelling Experience initialized.');
});
