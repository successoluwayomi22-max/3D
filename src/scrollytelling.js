import confetti from 'canvas-confetti';

export class ScrollytellingManager {
  constructor(sceneController, audioManager) {
    this.scene = sceneController;
    this.audio = audioManager;

    this.activeMode = '3d'; // '3d' | 'cinematic' | 'video'
    this.progress = 0;

    this.cacheDOM();
    this.initCinematicCanvas();
    this.initVideoPlayer();
    this.bindEvents();
    this.updateHUD(0);
  }

  cacheDOM() {
    this.track = document.getElementById('scrollytelling-track');
    this.hudProgress = document.getElementById('hud-progress-val');
    this.hudBar = document.getElementById('hud-progress-bar');
    this.hudPhase = document.getElementById('hud-phase-val');
    this.hudAltitude = document.getElementById('hud-alt-val');
    this.hudCoords = document.getElementById('hud-coords-val');

    this.chapters = document.querySelectorAll('.story-chapter');
    this.hotspotModal = document.getElementById('hotspot-modal');
    this.hotspotTitle = document.getElementById('hotspot-modal-title');
    this.hotspotCategory = document.getElementById('hotspot-modal-cat');
    this.hotspotDesc = document.getElementById('hotspot-modal-desc');
    this.hotspotImg = document.getElementById('hotspot-modal-img');
    this.hotspotClose = document.getElementById('hotspot-modal-close');

    // Canvas for Mode 2 (Cinematic 2D crossfade/wipe)
    this.cinematicCanvas = document.getElementById('cinematic-canvas');
    this.cinematicCtx = this.cinematicCanvas ? this.cinematicCanvas.getContext('2d') : null;

    // Video for Mode 3 (Video scrubbing)
    this.videoEl = document.getElementById('scrub-video');
    if (this.videoEl) {
      this.videoEl.playsInline = true;
      this.videoEl.setAttribute('playsinline', '');
      this.videoEl.setAttribute('webkit-playsinline', '');
    }
    this.videoSlot = document.getElementById('video-slot-container');
    this.videoInput = document.getElementById('video-file-input');

    // Controls
    this.modeButtons = document.querySelectorAll('.render-mode-btn');
    this.inspectToggleBtn = document.getElementById('inspect-mode-toggle');
    this.audioToggleBtn = document.getElementById('audio-toggle-btn');
  }

  initCinematicCanvas() {
    if (!this.cinematicCanvas) return;

    this.imgBlueprint = new Image();
    this.imgBlueprint.src = '/assets/blueprint.jpg';

    this.imgRealistic = new Image();
    this.imgRealistic.src = '/assets/campus_realistic.jpg';

    const resize = () => {
      this.cinematicCanvas.width = window.innerWidth;
      this.cinematicCanvas.height = window.innerHeight;
      this.renderCinematicWipe(this.progress);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  initVideoPlayer() {
    if (!this.videoEl) return;
    // Set video duration and properties
    this.videoEl.load();
    this.videoEl.pause();
  }

  bindEvents() {
    // Scroll tracking
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

    // Scene hotspot click listener
    this.scene.onHotspotClick = (data) => {
      this.openHotspot(data);
    };

    // Close hotspot modal
    if (this.hotspotClose) {
      this.hotspotClose.addEventListener('click', () => {
        this.closeHotspot();
      });
    }

    // Mode Buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.setRenderMode(mode);
      });
    });

    // Free 3D Inspect Mode Toggle
    if (this.inspectToggleBtn) {
      this.inspectToggleBtn.addEventListener('click', () => {
        const isInspect = this.inspectToggleBtn.classList.toggle('active');
        const viewport = document.querySelector('.scrollytelling-viewport');
        if (isInspect) {
          this.scene.setMode('inspect');
          if (viewport) viewport.classList.add('interactive-mode');
          this.inspectToggleBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
            <span>Exit 3D Inspect</span>
          `;
        } else {
          this.scene.setMode('story');
          if (viewport) viewport.classList.remove('interactive-mode');
          this.inspectToggleBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
            <span>Inspect 3D Free View</span>
          `;
        }
      });
    }

    // Audio Ambient Sound Toggle
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', () => {
        const playing = this.audio.toggle();
        this.audioToggleBtn.classList.toggle('active', playing);
        this.audioToggleBtn.querySelector('.audio-label').textContent = playing ? 'Ambience: On' : 'Ambience: Off';
      });
    }

    // Video Upload handler
    if (this.videoInput) {
      this.videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          this.videoEl.src = url;
          this.videoEl.load();
          this.setRenderMode('video');
        }
      });
    }

    // Click on Hotspot buttons in the page
    document.querySelectorAll('[data-hotspot-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.dataset.hotspotTarget;
        const found = this.scene.campus.hotspots.find(h => h.id === targetId);
        if (found) {
          this.openHotspot(found);
        }
      });
    });
  }

  handleScroll() {
    if (!this.track) return;
    const rect = this.track.getBoundingClientRect();
    const trackHeight = this.track.offsetHeight - window.innerHeight;
    const scrollY = -rect.top;

    let p = scrollY / trackHeight;
    const buildP = Math.max(0, Math.min(1, p));

    this.progress = p;

    // Send progress to 3D scene (supports build 0..1 and extended background pan > 1)
    this.scene.setProgress(p);

    // Update 2D Canvas Wipe (if active mode)
    if (this.activeMode === 'cinematic') {
      this.renderCinematicWipe(buildP);
    }

    // Scrub Video (if active mode)
    if (this.activeMode === 'video' && this.videoEl && this.videoEl.duration) {
      this.videoEl.currentTime = buildP * this.videoEl.duration;
    }

    this.updateHUD(buildP);
    this.updateChapters(buildP);

    // Fade bottom progress hud if deep in the lower content sections
    const hudBottom = document.querySelector('.hud-telemetry-bottom');
    if (hudBottom) {
      hudBottom.style.opacity = p > 1.2 ? '0.2' : '1';
    }
  }

  renderCinematicWipe(p) {
    if (!this.cinematicCtx || !this.cinematicCanvas) return;
    const ctx = this.cinematicCtx;
    const w = this.cinematicCanvas.width;
    const h = this.cinematicCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Cover drawing helper
    const drawCover = (img) => {
      if (!img.complete || img.naturalWidth === 0) return;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;
      let dw, dh, dx, dy;
      if (canvasRatio > imgRatio) {
        dw = w;
        dh = w / imgRatio;
        dx = 0;
        dy = (h - dh) / 2;
      } else {
        dh = h;
        dw = h * imgRatio;
        dx = (w - dw) / 2;
        dy = 0;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    // 1. Draw Blueprint base
    drawCover(this.imgBlueprint);

    // 2. Wipe Realistic image with angled laser scanline
    if (p > 0.01) {
      ctx.save();
      ctx.beginPath();
      // Diagonal wipe line
      const wipeX = p * (w + 200) - 100;
      ctx.moveTo(0, 0);
      ctx.lineTo(wipeX + 150, 0);
      ctx.lineTo(wipeX - 150, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.clip();

      drawCover(this.imgRealistic);
      ctx.restore();

      // Draw Glowing Cyan Laser Scanline edge
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wipeX + 150, 0);
      ctx.lineTo(wipeX - 150, h);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Secondary soft glow
      ctx.lineWidth = 12;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.stroke();
      ctx.restore();
    }
  }

  setRenderMode(mode) {
    this.activeMode = mode;
    this.modeButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    const threeCanvas = document.getElementById('webgl-container');

    if (mode === '3d') {
      threeCanvas.style.display = 'block';
      if (this.cinematicCanvas) this.cinematicCanvas.style.display = 'none';
      if (this.videoSlot) this.videoSlot.style.display = 'none';
      this.scene.setProgress(this.progress);
    } else if (mode === 'cinematic') {
      threeCanvas.style.display = 'none';
      if (this.cinematicCanvas) this.cinematicCanvas.style.display = 'block';
      if (this.videoSlot) this.videoSlot.style.display = 'none';
      this.renderCinematicWipe(this.progress);
    } else if (mode === 'video') {
      threeCanvas.style.display = 'none';
      if (this.cinematicCanvas) this.cinematicCanvas.style.display = 'none';
      if (this.videoSlot) this.videoSlot.style.display = 'block';
      if (this.videoEl && this.videoEl.duration) {
        this.videoEl.currentTime = this.progress * this.videoEl.duration;
      }
    }
  }

  updateHUD(p) {
    const percent = Math.round(p * 100);
    if (this.hudProgress) this.hudProgress.textContent = `${percent}%`;
    if (this.hudBar) this.hudBar.style.width = `${percent}%`;

    // Dynamic Phase
    let phase = 'PHASE I: BLUEPRINT SCHEMATIC';
    let alt = 48;
    if (p > 0.75) {
      phase = 'PHASE IV: REALIZED CAMPUS';
      alt = 8;
    } else if (p > 0.45) {
      phase = 'PHASE III: STRUCTURAL FORMATION';
      alt = 22;
    } else if (p > 0.20) {
      phase = 'PHASE II: GRID DISSOLVE & CAD REVEAL';
      alt = 36;
    }

    if (this.hudPhase) this.hudPhase.textContent = phase;
    if (this.hudAltitude) this.hudAltitude.textContent = `${Math.round(alt - p * 35)}m`;
    if (this.hudCoords) {
      const lat = (34.0522 + p * 0.0015).toFixed(4);
      const lng = (-118.2437 - p * 0.0018).toFixed(4);
      this.hudCoords.textContent = `${lat}° N, ${lng}° W`;
    }
  }

  updateChapters(p) {
    // 4 chapters spaced across 0.0 to 1.0
    // Chapter 0: 0.00 to 0.25
    // Chapter 1: 0.25 to 0.52
    // Chapter 2: 0.52 to 0.78
    // Chapter 3: 0.78 to 1.00
    const ranges = [
      { start: 0.00, end: 0.24 },
      { start: 0.25, end: 0.50 },
      { start: 0.51, end: 0.76 },
      { start: 0.77, end: 1.00 }
    ];

    this.chapters.forEach((chap, idx) => {
      const r = ranges[idx];
      const isActive = p >= r.start && p <= r.end;
      chap.classList.toggle('active', isActive);
    });
  }

  openHotspot(data) {
    if (!this.hotspotModal) return;

    this.hotspotTitle.textContent = data.title;
    this.hotspotCategory.textContent = data.category;
    this.hotspotDesc.textContent = data.description;

    // Contextual Image
    if (data.id === 'stem-lab') {
      this.hotspotImg.src = '/assets/stem_lab.jpg';
      this.hotspotImg.alt = 'Spring of Success Academy STEM Lab';
      this.hotspotImg.style.display = 'block';
    } else if (data.id === 'library') {
      this.hotspotImg.src = '/assets/library.jpg';
      this.hotspotImg.alt = 'Spring of Success Academy Rotunda Library';
      this.hotspotImg.style.display = 'block';
    } else if (data.id === 'clock-tower') {
      this.hotspotImg.src = '/assets/crest.jpg';
      this.hotspotImg.alt = 'Clock Tower Emblem';
      this.hotspotImg.style.display = 'block';
    } else {
      this.hotspotImg.src = '/assets/campus_realistic.jpg';
      this.hotspotImg.alt = 'Campus Centennial Quad';
      this.hotspotImg.style.display = 'block';
    }

    this.hotspotModal.classList.add('visible');
  }

  closeHotspot() {
    if (this.hotspotModal) {
      this.hotspotModal.classList.remove('visible');
    }
  }
}
