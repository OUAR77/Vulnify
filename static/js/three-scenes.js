import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

class VulnifyScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.clock = new THREE.Clock();
    this.shapes = [];
    this.particles = null;
    this.scrollY = 0;
    this.isMobile = window.innerWidth < 768;

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    const container = document.getElementById('three-canvas');
    if (container) container.appendChild(this.renderer.domElement);
    else document.body.prepend(this.renderer.domElement);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.style.pointerEvents = 'none';

    this.camera.position.z = 12;

    this.createAmbientLight();
    this.createShapes();
    this.createParticles();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    });

    this.animate();
  }

  createAmbientLight() {
    const ambient = new THREE.AmbientLight(0x443322, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xD4A853, 0.7);
    dir.position.set(1, 2, 1);
    this.scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xB8943F, 0.4);
    dir2.position.set(-1, -1, 2);
    this.scene.add(dir2);
  }

  createShapes() {
    const count = this.isMobile ? 6 : 14;
    const geometries = [
      { geo: new THREE.IcosahedronGeometry(0.25, 0), color: 0xD4A853 },
      { geo: new THREE.OctahedronGeometry(0.22, 0), color: 0xC89B3C },
      { geo: new THREE.DodecahedronGeometry(0.2, 0), color: 0xE8C45A },
      { geo: new THREE.TetrahedronGeometry(0.28, 0), color: 0xD4A853 },
      { geo: new THREE.BoxGeometry(0.18, 0.18, 0.18), color: 0xB8943F },
      { geo: new THREE.IcosahedronGeometry(0.15, 0), color: 0xE8D5A0 },
    ];

    for (let i = 0; i < count; i++) {
      const g = geometries[i % geometries.length];
      const mat = new THREE.MeshPhysicalMaterial({
        color: g.color,
        metalness: 0.05,
        roughness: 0.3,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
        emissive: g.color,
        emissiveIntensity: 0.03,
      });
      const mesh = new THREE.Mesh(g.geo, mat);

      const spread = this.isMobile ? 6 : 10;
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 8 - 2
      );

      mesh.rotation.set(Math.random() * 6, Math.random() * 6, 0);

      mesh.userData = {
        rotSpeed: 0.1 + Math.random() * 0.3,
        floatSpeed: 0.2 + Math.random() * 0.3,
        floatAmp: 0.2 + Math.random() * 0.4,
        floatOffset: Math.random() * 6,
        baseY: mesh.position.y,
        pulseSpeed: 0.3 + Math.random() * 0.4,
      };

      this.shapes.push(mesh);
      this.scene.add(mesh);
    }
  }

  createParticles() {
    const count = this.isMobile ? 400 : 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(0xD4A853);
    const c2 = new THREE.Color(0xB8943F);
    const c3 = new THREE.Color(0xE8C45A);

    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      positions[i * 3 + 2] = r * Math.cos(phi);

      const pick = Math.random();
      const c = pick < 0.4 ? c1 : pick < 0.7 ? c2 : c3;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    this.shapes.forEach((mesh) => {
      const { rotSpeed, floatSpeed, floatAmp, floatOffset, baseY, pulseSpeed } = mesh.userData;
      mesh.rotation.x += rotSpeed * 0.01;
      mesh.rotation.y += rotSpeed * 0.015;
      mesh.position.y = baseY + Math.sin(t * floatSpeed + floatOffset) * floatAmp;

      const pulse = 1 + Math.sin(t * pulseSpeed + floatOffset) * 0.05;
      mesh.scale.set(pulse, pulse, pulse);
    });

    if (this.particles) {
      this.particles.rotation.y = t * 0.015;
      this.particles.rotation.x = Math.sin(t * 0.005) * 0.03;
    }

    const scrollOffset = this.scrollY * 4;
    this.camera.position.z = 12 + scrollOffset;
    this.camera.position.y = this.scrollY * 1.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}

let instance = null;
export function initScene() {
  if (!instance) instance = new VulnifyScene();
  return instance;
}
