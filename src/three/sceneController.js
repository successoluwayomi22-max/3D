import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCampusModel } from './proceduralCampus.js';

export class CampusSceneController {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.currentMode = 'story'; // 'story' | 'inspect'
    this.scrollProgress = 0; // 0.0 to 1.0
    this.targetProgress = 0;
    this.onHotspotClick = null;
    this.parallaxMouse = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };

    this.initScene();
    this.initLights();
    this.initModel();
    this.initControls();
    this.initRaycaster();
    this.bindEvents();

    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060b17); // Deep dark prestige academy navy
    this.scene.fog = new THREE.FogExp2(0x060b17, 0.007);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.clock = new THREE.Clock();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 38, 55);
    this.cameraTarget = new THREE.Vector3(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient Skylight
    this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.8);
    this.scene.add(this.ambientLight);

    // Realistic Sun Directional Light (Golden hour)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(50, 60, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    // Warm Secondary Fill Light
    this.fillLight = new THREE.DirectionalLight(0xffa852, 0.9);
    this.fillLight.position.set(-40, 25, -20);
    this.scene.add(this.fillLight);

    // Blueprint Accent Light (Cyan)
    this.blueprintAccent = new THREE.PointLight(0x00f0ff, 3.0, 90);
    this.blueprintAccent.position.set(0, 20, 20);
    this.scene.add(this.blueprintAccent);
  }

  initModel() {
    this.campus = createCampusModel();
    this.scene.add(this.campus.rootGroup);
    this.updateMaterialsProgress(0);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going underground
    this.controls.minDistance = 10;
    this.controls.maxDistance = 140;
    this.controls.enabled = false; // Disabled by default for scroll story mode
  }

  initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.campus.hotspotGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.id && this.onHotspotClick) {
          this.onHotspotClick(hit.userData);
        }
      }
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'inspect') {
      this.controls.enabled = true;
      this.controls.target.copy(this.currentCameraTarget);
    } else {
      this.controls.enabled = false;
    }
  }

  setProgress(progress) {
    this.targetProgress = Math.max(0, progress);
  }

  updateMaterialsProgress(p) {
    // 0 = Full Blueprint, 1 = Full Realistic Campus
    const buildP = THREE.MathUtils.clamp(p, 0, 1);
    const bpGroup = this.campus.blueprintGroup;
    const realGroup = this.campus.realisticGroup;
    const scanline = this.campus.scanlineMesh;

    // Scanline motion along Z axis from back (-15) to front (50)
    const scanZ = THREE.MathUtils.lerp(-15, 50, buildP);
    scanline.position.z = scanZ;

    // Scanline intensity peaks during middle transition
    const scanIntensity = Math.sin(buildP * Math.PI) * 1.5;
    scanline.material.opacity = scanIntensity * 0.8;
    scanline.scale.set(1, 1 + scanIntensity * 2, 1);

    // Blueprint vs Realistic Crossfade
    const realAlpha = THREE.MathUtils.clamp((buildP - 0.15) / 0.7, 0, 1);
    const bpAlpha = THREE.MathUtils.clamp(1.0 - (buildP - 0.1) / 0.75, 0, 1);

    bpGroup.visible = bpAlpha > 0.01;
    realGroup.visible = realAlpha > 0.01;

    // Adjust lights based on transition
    this.sunLight.intensity = 0.4 + realAlpha * 2.0;
    this.fillLight.intensity = 0.2 + realAlpha * 0.9;
    this.blueprintAccent.intensity = bpAlpha * 3.5;

    // Atmosphere background shift
    const darkBpColor = new THREE.Color(0x050c18);
    const daySkyColor = new THREE.Color(0x0d1a33);
    this.scene.background.lerpColors(darkBpColor, daySkyColor, buildP);
    this.scene.fog.color.lerpColors(darkBpColor, daySkyColor, buildP);
  }

  getCameraWaypoints(p) {
    // Beyond Chapter 4 (p > 1.0): Gentle panoramic orbit around the realized campus
    if (p > 1.0) {
      const extra = p - 1.0;
      const angle = extra * 0.85;
      const radius = 28;
      const posX = Math.sin(angle) * radius;
      const posZ = 16 + Math.cos(angle) * 12;
      const posY = 6.8 + Math.sin(angle * 1.5) * 2.2;
      return {
        pos: new THREE.Vector3(posX, posY, posZ),
        target: new THREE.Vector3(0, 7.0, 6)
      };
    }

    // Waypoint Interpolation for cinematic storytelling (0.0 to 1.0)
    const waypoints = [
      { p: 0.00, pos: [0, 42, 58], target: [0, 10, 0] },
      { p: 0.28, pos: [38, 30, 48], target: [0, 12, 6] },
      { p: 0.58, pos: [-28, 18, 42], target: [-8, 8, 14] },
      { p: 0.82, pos: [0, 10, 38], target: [0, 8, 12] },
      { p: 1.00, pos: [0, 5.5, 24], target: [0, 5.5, 9] }
    ];

    let i = 0;
    while (i < waypoints.length - 2 && waypoints[i + 1].p < p) {
      i++;
    }

    const w0 = waypoints[i];
    const w1 = waypoints[i + 1];
    const localT = (p - w0.p) / (w1.p - w0.p);
    const smoothT = localT * localT * (3 - 2 * localT);

    const pos = new THREE.Vector3(
      THREE.MathUtils.lerp(w0.pos[0], w1.pos[0], smoothT),
      THREE.MathUtils.lerp(w0.pos[1], w1.pos[1], smoothT),
      THREE.MathUtils.lerp(w0.pos[2], w1.pos[2], smoothT)
    );

    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(w0.target[0], w1.target[0], smoothT),
      THREE.MathUtils.lerp(w0.target[1], w1.target[1], smoothT),
      THREE.MathUtils.lerp(w0.target[2], w1.target[2], smoothT)
    );

    return { pos, target };
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Frame-rate independent exponential smoothing
    const delta = Math.min(this.clock.getDelta(), 0.08);
    const factor = 1.0 - Math.exp(-9.5 * delta);

    this.scrollProgress += (this.targetProgress - this.scrollProgress) * factor;
    this.updateMaterialsProgress(this.scrollProgress);

    // Animate Hotspot Pins pulsing
    const time = performance.now() * 0.003;
    if (this.campus && this.campus.hotspotGroup) {
      this.campus.hotspotGroup.children.forEach((pin, idx) => {
        const pulse = 1.0 + Math.sin(time * 2 + idx) * 0.18;
        pin.scale.set(pulse, pulse, pulse);
      });
    }

    // Parallax damping
    this.parallaxMouse.x += (this.targetParallax.x - this.parallaxMouse.x) * 0.05;
    this.parallaxMouse.y += (this.targetParallax.y - this.parallaxMouse.y) * 0.05;

    // Direct camera synchronization with smoothly damped scrollProgress + mouse parallax
    if (this.currentMode === 'story') {
      const { pos, target } = this.getCameraWaypoints(this.scrollProgress);
      pos.x += this.parallaxMouse.x * 3.0;
      pos.y += -this.parallaxMouse.y * 1.8;
      this.camera.position.copy(pos);
      this.camera.lookAt(target);
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  bindEvents() {
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.handleMouseMove = (e) => {
      this.targetParallax.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetParallax.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    if (this.handleMouseMove) window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
