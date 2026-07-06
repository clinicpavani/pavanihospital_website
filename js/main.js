/**
 * LUNIRA 3D SYSTEM ENGINE — PAVANI HOSPITAL v3.2 (CENTERED SCROLL ENGINE)
 */

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    // WebGL / Three.js Instance Elements
    scene: null,
    camera: null,
    renderer: null,
    particleSystem: null,
    gridHelper: null,
    isRotating: true,
    colorMode: 0,
    
    // Smooth camera target positions
    cameraPos: { x: 0, y: 0, z: 10, rx: 0, ry: 0 },
    targetCameraPos: { x: 0, y: 0, z: 10, rx: 0, ry: 0 },
    
    // Mouse tracking (for card tilt & custom cursor)
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },

    init() {
      // Force page to start cleanly from top fold on refresh/reload
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);

      // this.initCustomCursor();
      this.initThreeJS();
      this.initScrollReveal();
      this.initScrollSpy();
      this.initMobileBurger();
      this.initInteractiveCards();
      this.initPhysicianAccordion();
      this.initTriageBookingForm();
      this.initResizeHandler();
      this.animate();
    },

    // 1. Custom Cursor Follow (with Lerp)
    initCustomCursor() {
      const cursor = document.getElementById('custom-cursor');
      const dot = document.getElementById('cursor-dot');
      if (!cursor || !dot) return;

      document.addEventListener('mousemove', (e) => {
        this.mouse.tx = e.clientX;
        this.mouse.ty = e.clientY;
      });

      // Show cursor highlight on hover
      const updateHoverState = () => {
        const hoverables = document.querySelectorAll('a, button, input, select, textarea, .physician-row, .hud-toggle-btn');
        hoverables.forEach(item => {
          if (item.dataset.cursorBound) return;
          item.dataset.cursorBound = "true";
          
          item.addEventListener('mouseenter', () => {
            cursor.style.width = '60px';
            cursor.style.height = '60px';
            cursor.style.borderColor = 'rgba(37, 99, 235, 0.6)';
          });
          item.addEventListener('mouseleave', () => {
            cursor.style.width = '40px';
            cursor.style.height = '40px';
            cursor.style.borderColor = 'rgba(37, 99, 235, 0.25)';
          });
        });
      };

      // Hide custom cursor over Google Maps frame to let native pointer interact
      const mapFrame = document.querySelector('.map-container-frame');
      if (mapFrame) {
        mapFrame.addEventListener('mouseenter', () => {
          cursor.style.opacity = '0';
          dot.style.opacity = '0';
        });
        mapFrame.addEventListener('mouseleave', () => {
          cursor.style.opacity = '1';
          dot.style.opacity = '1';
        });
      }

      updateHoverState();
      const observer = new MutationObserver(updateHoverState);
      observer.observe(document.body, { childList: true, subtree: true });
    },

    // 2. Three.js 3D WebGL Helix Particle Space
    initThreeJS() {
      const canvas = document.getElementById('webgl-canvas');
      if (!canvas) return;

      // Init Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0xF8FAFC, 0.035);

      this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 0, 10);

      // Init WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Build points structure: 1600 helix particles + 1200 ambient background stars
      const particleCount = 2800;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color(0x2563EB), // Medical blue
        new THREE.Color(0x16A34A), // Life green
        new THREE.Color(0x7C3AED)  // Healing purple
      ];

      for (let i = 0; i < particleCount; i++) {
        if (i < 1600) {
          // Helix structure
          const t = (i / 1600) * Math.PI * 36;
          const strand = i % 2 === 0 ? 1 : -1;
          
          const x = Math.sin(t) * 2.8 * strand;
          const y = (i / 1600) * 60 - 45; // Stretched vertically
          const z = Math.cos(t) * 2.8 * strand;

          positions[i * 3] = x + (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;
        } else {
          // Ambient starfield dispersion to guarantee background coverage as helix rotates
          positions[i * 3] = (Math.random() - 0.5) * 22; // Wider X field
          positions[i * 3 + 1] = Math.random() * 65 - 50; // Vertical span matching helix
          positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // Z depth field
        }

        const c = colorPalette[i % colorPalette.length];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.NormalBlending
      });

      this.particleSystem = new THREE.Points(geometry, material);
      this.scene.add(this.particleSystem);

      // Floor grid grid-helper
      this.gridHelper = new THREE.GridHelper(40, 40, 0xE2E8F0, 0xF1F5F9);
      this.gridHelper.position.y = -10;
      this.gridHelper.rotation.x = Math.PI / 16;
      this.scene.add(this.gridHelper);
    },



    // 4. Scroll Reveal Engine
    initScrollReveal() {
      const slides = document.querySelectorAll('.pan-slide');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible-section');
          }
        });
      }, { threshold: 0.08 });

      slides.forEach(s => obs.observe(s));
    },

    // 5. ScrollSpy sync linking WebGL camera and topbar navigation indicators
    initScrollSpy() {
      const slides = document.querySelectorAll('.pan-slide');
      const navLinks = document.querySelectorAll('.topnav-link');
      const dockItems = document.querySelectorAll('.dock-item');

      const onScroll = () => {
        const scrollY = window.scrollY;
        const winHeight = window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight - winHeight;
        const scrollPercent = scrollY / (totalHeight || 1);

        // Update camera targets based on scroll height (panning down further to match stretched helix)
        this.targetCameraPos.z = 10 + Math.sin(scrollPercent * Math.PI) * 4;
        this.targetCameraPos.y = -scrollPercent * 30; // Stretched pan range
        this.targetCameraPos.x = Math.sin(scrollPercent * Math.PI * 2) * 2;
        this.targetCameraPos.ry = scrollPercent * Math.PI * 2;

        let currentSectionId = '';
        const isAtBottom = (winHeight + scrollY) >= document.documentElement.scrollHeight - 150; // trigger early near bottom

        if (isAtBottom) {
          currentSectionId = 'location';
        } else {
          slides.forEach(slide => {
            const top = slide.offsetTop - 280;
            const height = slide.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
              currentSectionId = slide.id;
            }
          });
        }

        if (currentSectionId) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href').substring(1);
            link.classList.toggle('active', href === currentSectionId);
          });
          dockItems.forEach(item => {
            const href = item.getAttribute('href').substring(1);
            item.classList.toggle('active', href === currentSectionId);
          });
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Smooth scroll anchors clicks
      const allLinks = document.querySelectorAll('.topnav-link, .dock-item, .quick-book-btn, .nav-logo, .interactive-cta');
      allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetEl = document.getElementById(href.substring(1));
            if (targetEl) {
              const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
              const offsetPosition = elementPosition - 40; // 40px offset: lets section padding scroll behind the navbar

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }
        });
      });
    },

    // 6. Mobile burger overlay trigger logic
    initMobileBurger() {
      const burger = document.getElementById('burger');
      const overlay = document.getElementById('mobile-overlay');
      if (!burger || !overlay) return;

      const links = overlay.querySelectorAll('a');

      const toggleMenu = () => {
        const isOpen = overlay.classList.contains('open');
        burger.classList.toggle('active', !isOpen);
        overlay.classList.toggle('open', !isOpen);
        document.body.style.overflow = !isOpen ? 'hidden' : '';
      };

      burger.addEventListener('click', toggleMenu);
      links.forEach(l => l.addEventListener('click', () => {
        burger.classList.remove('active');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }));
    },

    // 7. Interactive tilts & card glows
    initInteractiveCards() {
      const cards = document.querySelectorAll('.console-card, .infra-panel, .triage-form, .map-container-frame');
      
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
          card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

          const rotX = ((y / rect.height) - 0.5) * -15; 
          const rotY = ((x / rect.width) - 0.5) * 15;

          card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
      });
    },

    // 8. Accordion row highlight
    initPhysicianAccordion() {
      const rows = document.querySelectorAll('.physician-row');
      rows.forEach(row => {
        row.addEventListener('click', () => {
          rows.forEach(r => r.classList.remove('active'));
          row.classList.add('active');
        });
      });
    },

    // 9. Booking Form Triage Engine
    initTriageBookingForm() {
      const form = document.getElementById('triage-booking-form');
      const overlay = document.getElementById('triage-overlay');
      const fallbackBtn = document.getElementById('fallback-wa-btn');
      if (!form || !overlay) return;

      const dateSelect = document.getElementById('app-date');
      if (dateSelect) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateSelect.min = `${year}-${month}-${day}`;
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('patient-name').value.trim();
        const phone = document.getElementById('patient-phone').value.trim();
        const doctor = document.getElementById('doc-select').value;
        const date = document.getElementById('app-date').value;
        const sym = document.getElementById('patient-desc').value.trim();

        if (!name || !phone || !doctor || !date) return;

        const dateFormatted = new Date(date).toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const textPayload = `Hello Pavani Hospital,\nI would like to book a consultation:\n\n` +
                            `• Patient Name: ${name}\n` +
                            `• Contact No: ${phone}\n` +
                            `• Physician Selected: ${doctor}\n` +
                            `• Date Requested: ${dateFormatted}\n` +
                            `• Symptoms / Info: ${sym || 'General Outpatient checkup request'}`;

        const secureWhatsAppURL = `https://wa.me/919014669818?text=${encodeURIComponent(textPayload)}`;

        const modalInside = overlay.querySelector('.triage-modal-card');
        if (modalInside) modalInside.classList.remove('success');
        if (fallbackBtn) fallbackBtn.style.display = 'none';

        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        const performRedirect = () => {
          const gate = document.createElement('a');
          gate.href = secureWhatsAppURL;
          gate.target = '_blank';
          gate.rel = 'noopener';
          gate.click();
        };

        if (fallbackBtn) fallbackBtn.onclick = performRedirect;

        setTimeout(() => {
          if (modalInside) modalInside.classList.add('success');
          setTimeout(() => {
            performRedirect();
            if (fallbackBtn) fallbackBtn.style.display = 'block';
            form.reset();
          }, 800);
        }, 1200);
      });

      const dismissOverlay = () => {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      };

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismissOverlay();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
          dismissOverlay();
        }
      });
    },

    // 10. Resize
    initResizeHandler() {
      window.addEventListener('resize', () => {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
    },

    // 11. Ticking loop
    animate() {
      requestAnimationFrame(() => this.animate());

      const cursor = document.getElementById('custom-cursor');
      const dot = document.getElementById('cursor-dot');
      if (cursor && dot) {
        const curX = parseFloat(cursor.style.left) || 0;
        const curY = parseFloat(cursor.style.top) || 0;
        
        const nextX = curX + (this.mouse.tx - curX) * 0.12;
        const nextY = curY + (this.mouse.ty - curY) * 0.12;

        cursor.style.left = `${nextX}px`;
        cursor.style.top = `${nextY}px`;
        dot.style.left = `${this.mouse.tx}px`;
        dot.style.top = `${this.mouse.ty}px`;
      }

      if (this.camera) {
        this.cameraPos.x += (this.targetCameraPos.x - this.cameraPos.x) * 0.05;
        this.cameraPos.y += (this.targetCameraPos.y - this.cameraPos.y) * 0.05;
        this.cameraPos.z += (this.targetCameraPos.z - this.cameraPos.z) * 0.05;
        
        this.camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
      }

      if (this.particleSystem) {
        if (this.isRotating) {
          this.particleSystem.rotation.y += 0.0015;
          this.particleSystem.rotation.z += 0.0005;
        }

        const targetRx = (this.mouse.ty / window.innerHeight - 0.5) * 0.2;
        const targetRy = (this.mouse.tx / window.innerWidth - 0.5) * 0.2;

        this.particleSystem.rotation.x += (targetRx - this.particleSystem.rotation.x) * 0.05;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  };

  App.init();
});
