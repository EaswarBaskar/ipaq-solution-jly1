/* ============================
 *  STATE & CONFIG
 * ============================ */
const SLIDES = 6;
const TRANSITION_MS = 1200;
const COOLDOWN_MS = 1600;
let currentSlide = 0;
let isLocked = false;
let lastWheelTime = 0;
let rafId = null;
let mouseX = 0, mouseY = 0;

const palettes = [
    { accent: '#0EA5E9', glow: 'rgba(14,165,233,0.4)' }, // Home: Electric Blue
    { accent: '#F8FAFC', glow: 'rgba(248,250,252,0.4)' }, // Tech: Stark White
    { accent: '#6366F1', glow: 'rgba(99,102,241,0.4)' }, // About: Indigo Tech
    { accent: '#10B981', glow: 'rgba(16,185,129,0.4)' }, // Services: Emerald Precision
    { accent: '#F59E0B', glow: 'rgba(245,158,11,0.4)' }, // Clients: Industrial Amber
    { accent: '#0EA5E9', glow: 'rgba(14,165,233,0.4)' }  // Contact: Return to Brand Blue
];

/* ============================
 *  SMOOTH SCROLL (LENIS)
 * ============================ */
const lenis = new Lenis({
    duration: 1.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
});

if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0, 0);
}

/* ============================
 *  DOM REFS
 * ============================ */
const bgTrack = document.getElementById('bg-track');
const contentWrapper = document.getElementById('content-wrapper');
const navLinks = document.querySelectorAll('.nav-links a');
const slideDots = document.querySelectorAll('.slide-dot');
const sections = document.querySelectorAll('.section');
const bgSlides = document.querySelectorAll('.bg-slide');
const cursorDot = document.getElementById('cursor-dot');
const cursorCircle = document.getElementById('cursor-circle');
const hamburger = document.querySelector('.hamburger');
const navLinksContainer = document.querySelector('.nav-links');

/* ============================
 *  LOADING
 * ============================ */
(function initLoader() {
    let p = 0;
    const bar = document.getElementById('progress');
    const tick = setInterval(() => {
        p += Math.random() * 18 + 2;
        if (p >= 100) {
            p = 100;
            bar.style.width = '100%';
            clearInterval(tick);
            setTimeout(() => {
                document.getElementById('loader').classList.add('hidden');
                window.scrollTo(0, 0);
                setTimeout(() => { if (window.playHomeAnims) window.playHomeAnims(); }, 200);
            }, 400);
        } else {
            bar.style.width = p + '%';
        }
    }, 90);
})();

/* ============================
 *  NAVIGATION LOGIC
 * ============================ */
function goToSlide(index) {
    const section = sections[index];
    if (section && lenis) {
        lenis.scrollTo(section, { offset: 0, duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    } else if (section) {
        window.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
    }
}

// Nav Link Click Listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(link.getAttribute('data-index'));
        goToSlide(index);
        
        // Close mobile menu
        hamburger.classList.remove('open');
        navLinksContainer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    });
});

// Indicator Dot Click Listeners
slideDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const index = parseInt(dot.getAttribute('data-slide'));
        goToSlide(index);
    });
});

// Hamburger Menu Toggle
hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    hamburger.classList.toggle('open');
    navLinksContainer.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', !isOpen);
});

// Active indicator update on scroll
window.addEventListener('scroll', () => {
    let found = 0;
    sections.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            found = i;
        }
    });
    if (found !== currentSlide) {
        currentSlide = found;
        navLinks.forEach((a, i) => a.classList.toggle('active', i === found));
        slideDots.forEach((d, i) => d.classList.toggle('active', i === found));
        sections.forEach((s, i) => s.classList.toggle('active', i === found));

        // Update theme variables smoothly
        gsap.to(document.documentElement, {
            '--c-accent': palettes[found].accent,
            '--c-glow': palettes[found].glow,
            duration: 0.8,
            ease: "power2.out"
        });
    }
});

/* ============================
 *  MODERN 3D STORYTELLING ENGINE
 * ============================ */
let scene, camera, renderer, model, modelGroup, particles, animationGroup;
const canvasContainer = document.getElementById('three-canvas-container');

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasContainer.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 3, 20);
    cyanLight.position.set(-5, -5, -5);
    scene.add(cyanLight);
    
    const purpleLight = new THREE.PointLight(0xffaa00, 3, 20); // Warm Amber Light
    purpleLight.position.set(5, 0, -5);
    scene.add(purpleLight);

    // Particle System (Sparks, Dust, Cyan, Blue)
    const particlesCount = 4000;
    const posArray = new Float32Array(particlesCount * 3);
    const colArray = new Float32Array(particlesCount * 3);
    const colors = [new THREE.Color(0xffaa00), new THREE.Color(0xffffff), new THREE.Color(0x0ea5e9), new THREE.Color(0xcbd5e1)];
    
    for (let i = 0; i < particlesCount; i++) {
        posArray[i*3] = (Math.random() - 0.5) * 60;
        posArray[i*3+1] = (Math.random() - 0.5) * 60;
        posArray[i*3+2] = (Math.random() - 0.5) * 60;
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        colArray[i*3] = color.r;
        colArray[i*3+1] = color.g;
        colArray[i*3+2] = color.b;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Tech Grid Floor
    const grid = new THREE.GridHelper(100, 40, 0x8800ff, 0x0EA5E9);
    grid.position.y = -15;
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    scene.add(grid);

    // Model Group for ScrollTrigger logic
    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Animation Group for constant spinning logic
    animationGroup = new THREE.Group();
    modelGroup.add(animationGroup);

    // Central Biotech Structure (DNA Double Helix)
    model = new THREE.Group();
    
    const dnaMaterialA = new THREE.MeshPhysicalMaterial({
        color: 0x0072bc, // Bright Blue
        emissive: 0x000000, // Removed emissive glow
        emissiveIntensity: 0.0,
        metalness: 0.6,
        roughness: 0.4,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.5
    });

    const dnaMaterialB = new THREE.MeshPhysicalMaterial({
        color: 0x8cc63f, // Lime Green
        emissive: 0x000000, // Removed emissive glow
        emissiveIntensity: 0.0,
        metalness: 0.6,
        roughness: 0.4,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.5
    });
    
    const connectionMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8cc63f, // Lime Green base pairs to match image
        metalness: 0.6,
        roughness: 0.4,
        transparent: true,
        opacity: 0.4
    });

    const dnaHeight = 8;
    const turns = 2.5;
    const basePairs = 30;
    const radiusDNA = 1.2;

    const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const cylinderGeo = new THREE.CylinderGeometry(0.06, 0.06, radiusDNA * 2, 8);

    for (let i = 0; i <= basePairs; i++) {
        const t = i / basePairs;
        const angle = t * Math.PI * 2 * turns;
        const y = (t - 0.5) * dnaHeight;
        
        // Strand A (Blue)
        const xA = Math.cos(angle) * radiusDNA;
        const zA = Math.sin(angle) * radiusDNA;
        const sphereA = new THREE.Mesh(sphereGeo, dnaMaterialA);
        sphereA.position.set(xA, y, zA);
        model.add(sphereA);
        
        // Strand B (Green)
        const xB = Math.cos(angle + Math.PI) * radiusDNA;
        const zB = Math.sin(angle + Math.PI) * radiusDNA;
        const sphereB = new THREE.Mesh(sphereGeo, dnaMaterialB);
        sphereB.position.set(xB, y, zB);
        model.add(sphereB);

        // Connection
        const connection = new THREE.Mesh(cylinderGeo, connectionMaterial);
        connection.position.set(0, y, 0);
        connection.rotation.y = -angle; 
        connection.rotation.z = Math.PI / 2;
        model.add(connection);
    }
    
    animationGroup.add(model);

    // Orbiting Holographic Glass Panels ("The Gear")
    const panelCount = 6;
    const radius = 4.5;
    const texts = ["FRONTIER", "PRECISION", "ENGINEERED", "FUTURE", "SYSTEMS", "TEKTON"];
    
    for (let i = 0; i < panelCount; i++) {
        const angle = (i / panelCount) * Math.PI * 2;
        
        // Generate Text Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createLinearGradient(0,0,0,256);
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Glitchy text effect
        ctx.font = 'bold 50px "Space Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = 'rgba(14, 165, 233, 0.8)'; // Electric Blue
        ctx.fillText(texts[i], 258, 128);
        ctx.fillStyle = 'rgba(255, 170, 0, 0.8)'; // Amber
        ctx.fillText(texts[i], 254, 128);
        
        ctx.shadowColor = 'rgba(14, 165, 233, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'white';
        ctx.fillText(texts[i], 256, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const panelGeo = new THREE.PlaneGeometry(3.5, 1.75);
        const panelMat = new THREE.MeshPhysicalMaterial({
            map: texture,
            transparent: true,
            opacity: 0.25,
            roughness: 0.1,
            metalness: 0.2,
            clearcoat: 1.0,
            side: THREE.DoubleSide
        });
        
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius);
        panel.rotation.y = -angle + Math.PI / 2;
        
        animationGroup.add(panel);
    }

    camera.position.z = 12;
    modelGroup.scale.set(0.6, 0.6, 0.6);
    // Offset the model to prevent text overlap
    modelGroup.position.set(4.5, -0.5, -4);
    modelGroup.rotation.y = -Math.PI / 8; // slight angle

    setupScrollAnims();
    animate();
}

function setupScrollAnims() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#content-wrapper",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
        }
    });

    // Section 0 (Home) -> Section 1 (Showcase)
    tl.to(modelGroup.position, { x: 0, y: 0, z: 0, duration: 1 })
        .to(modelGroup.rotation, { y: Math.PI * 2, x: Math.PI, duration: 1 }, 0)
        .to(modelGroup.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 0)
        .to(particles.rotation, { y: Math.PI * 0.5, duration: 1 }, 0)
        // Background fade
        .to(bgSlides[0], { opacity: 0.3, duration: 1 }, 0)
        .to(bgSlides[1], { opacity: 1, duration: 1 }, 0);

    // Section 1 -> Section 2 (About)
    tl.to(modelGroup.position, { x: 4, y: 0.5, duration: 1 })
        .to(modelGroup.rotation, { z: Math.PI, duration: 1 }, "-=1")
        .to(particles.position, { x: -2, duration: 1 }, "-=1")
        .to(bgSlides[1], { opacity: 0, duration: 1 }, "-=1")
        .to(bgSlides[2], { opacity: 1, duration: 1 }, "-=1");

    // Section 2 -> Section 3 (Services)
    tl.to(modelGroup.position, { x: -4, y: 1.5, z: -2, duration: 1 })
        .to(modelGroup.scale, { x: 1, y: 1, z: 1, duration: 1 }, "-=1")
        .to(particles.rotation, { x: Math.PI, duration: 1 }, "-=1")
        .to(bgSlides[2], { opacity: 0.4, duration: 1 }, "-=1");

    // Section 3 -> Section 4 (Clients)
    tl.to(modelGroup.position, { x: 1, y: -3, z: 2, duration: 1 })
        .to(modelGroup.rotation, { y: Math.PI * 4, duration: 1 }, "-=1")
        .to(bgSlides[2], { opacity: 0.2, duration: 1 }, "-=1");

    // Section 4 -> Section 5 (Contact)
    tl.to(modelGroup.position, { x: 2, y: -1, z: -4, duration: 1 }) // Offset to side for readability
        .to(modelGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1 }, "-=1")
        .to(particles.material, { opacity: 0.6, duration: 1 }, "-=1")
        .to(bgSlides[0], { opacity: 0.5, duration: 1 }, "-=1");

    // =====================================
    // PREMIUM MOTION FEEL - "MOVIE REVEALS"
    // =====================================

    // Showcase text and HUD
    gsap.fromTo('.showcase-content > *',
        { y: 80, opacity: 0, filter: 'blur(15px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, stagger: 0.2, ease: "power4.out",
          scrollTrigger: { trigger: '#showcase', start: 'top 65%', toggleActions: "play reverse play reverse" } }
    );
    gsap.fromTo('.hud-element',
        { y: 40, opacity: 0, scale: 0.9, filter: 'blur(10px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.1, ease: "back.out(1.5)",
          scrollTrigger: { trigger: '#showcase', start: 'top 50%', toggleActions: "play reverse play reverse" } }
    );

    // About Text 
    gsap.fromTo('.about-text',
        { y: 50, opacity: 0, filter: 'blur(20px) contrast(200%)', scale: 1.05 },
        { y: 0, opacity: 1, filter: 'blur(0px) contrast(100%)', scale: 1, duration: 2, ease: "power3.out",
          scrollTrigger: { trigger: '#about', start: 'top 60%', toggleActions: "play reverse play reverse" } }
    );

    // Products 
    gsap.fromTo('#products .section-title',
        { opacity: 0, y: 50, rotationX: 45 },
        { opacity: 1, y: 0, rotationX: 0, duration: 1.5, ease: "power4.out",
          scrollTrigger: { trigger: '#products', start: 'top 75%', toggleActions: "play reverse play reverse" } }
    );
    gsap.fromTo('.product-item',
        { y: 150, opacity: 0, scale: 0.9, filter: 'blur(10px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: "expo.out",
          scrollTrigger: { trigger: '#products .product-grid', start: 'top 85%', toggleActions: "play reverse play reverse" } }
    );

    // Clients
    gsap.fromTo('#clients .section-title',
        { opacity: 0, x: -50, filter: 'blur(10px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.5, ease: "power4.out",
          scrollTrigger: { trigger: '#clients', start: 'top 80%', toggleActions: "play reverse play reverse" } }
    );
    
    gsap.fromTo('.client-ticker-wrap',
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power4.out", delay: 0.2,
          scrollTrigger: { trigger: '#clients', start: 'top 80%', toggleActions: "play reverse play reverse" } }
    );

    // Contact
    gsap.fromTo('.contact-info > *',
        { x: -50, opacity: 0, filter: 'blur(10px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: '#contact', start: 'top 70%', toggleActions: "play reverse play reverse" } }
    );
    gsap.fromTo('.map-container',
        { scale: 0.8, opacity: 0, filter: 'grayscale(100%) blur(20px)' },
        { scale: 1, opacity: 1, filter: 'grayscale(30%) blur(0px)', duration: 1.8, ease: "expo.out",
          scrollTrigger: { trigger: '#contact', start: 'top 70%', toggleActions: "play reverse play reverse" } }
    );
}

// Global scope window attach for Home reveal
window.playHomeAnims = () => {
    const hlLines = document.querySelectorAll('.headline > div');
    
    // Movie-style startup
    gsap.fromTo(hlLines, 
        { y: 120, opacity: 0, filter: 'blur(15px)', rotationZ: 2 },
        { y: 0, opacity: 1, filter: 'blur(0px)', rotationZ: 0, duration: 1.5, stagger: 0.2, ease: "expo.out" }
    );
    gsap.fromTo('.badge', 
        { y: 30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.5)", delay: 0.5 }
    );
    gsap.fromTo('.subtitle', 
        { y: 40, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: "power3.out", delay: 0.8 }
    );
    gsap.fromTo('.cta-group a', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 1 }
    );
    gsap.fromTo('.stats-card',
        { x: 100, opacity: 0, clipPath: 'inset(0% 0% 0% 100%)' },
        { x: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: "expo.out", delay: 1.2 }
    );
    gsap.fromTo('.ui-brackets .bracket',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.5, stagger: 0.1, ease: "back.out(1.5)", delay: 0.8 }
    );
}

let is3DVisible = true;
if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        is3DVisible = !document.hidden;
    });
    const observer = new IntersectionObserver((entries) => {
        is3DVisible = entries.some(entry => entry.isIntersecting);
    });
    window.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.getElementById('content-wrapper');
        if (wrapper) observer.observe(wrapper);
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (!is3DVisible) return;

    const time = Date.now() * 0.0001;

    if (animationGroup) {
        animationGroup.rotation.y += 0.001;
        animationGroup.position.y = Math.sin(time * 10) * 0.05; // Floats slightly
        
        // Reverse spin the central object slightly for dynamic multi-layered interaction
        if (model) {
            model.rotation.x += 0.0003;
            model.rotation.z -= 0.0006;
        }
    } else if (model) {
        model.rotation.y += 0.003;
        model.position.y += Math.sin(time * 10) * 0.001;
    }

    if (particles) {
        particles.rotation.y += 0.0005;
        particles.rotation.x += 0.0002;
    }

    renderer.render(scene, camera);
}

window.addEventListener('load', init3D);
let lastWindowWidth = window.innerWidth;
window.addEventListener('resize', () => {
    if (window.innerWidth !== lastWindowWidth) {
        lastWindowWidth = window.innerWidth;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Cursor & Parallax Logic
const cursorDotX = gsap.quickTo(cursorDot, "x", {duration: 0.05, ease: "power2.out"});
const cursorDotY = gsap.quickTo(cursorDot, "y", {duration: 0.05, ease: "power2.out"});
const cursorCircleX = gsap.quickTo(cursorCircle, "x", {duration: 0.4, ease: "power3.out"});
const cursorCircleY = gsap.quickTo(cursorCircle, "y", {duration: 0.4, ease: "power3.out"});
const bgTrackX = gsap.quickTo(bgTrack, "x", {duration: 1.5, ease: "power2.out"});
const bgTrackY = gsap.quickTo(bgTrack, "y", {duration: 1.5, ease: "power2.out"});

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    
    // Smooth transform instead of left/top layout changes
    cursorDotX(mouseX);
    cursorDotY(mouseY);
    cursorCircleX(mouseX);
    cursorCircleY(mouseY);

    const moveX = (mouseX / window.innerWidth - 0.5) * 2;
    const moveY = (mouseY / window.innerHeight - 0.5) * 2;

    // Background Parallax
    if (bgTrack) {
        bgTrackX(moveX * 30);
        bgTrackY(moveY * 30);
    }

    // HUD Floating interaction
    gsap.to('.hud-element', {
        x: moveX * 40,
        y: moveY * 40,
        duration: 2,
        stagger: 0.05,
        ease: "power2.out",
        overwrite: "auto"
    });

    if (model) {
        gsap.to(model.rotation, {
            x: "+=" + (mouseY / window.innerHeight - 0.5) * 0.05,
            y: "+=" + (mouseX / window.innerWidth - 0.5) * 0.05,
            duration: 1,
            overwrite: "auto"
        });
    }

    if (particles) {
        gsap.to(particles.position, {
            x: moveX * 2,
            y: moveY * -2,
            duration: 2,
            ease: "power2.out",
            overwrite: "auto"
        });
    }
});

document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, .product-item, .client-item');
    document.body.classList.toggle('cursor-hover', !!interactive);
});

/* ============================
 *  PRODUCT DETAIL LOGIC
 * ============================ */
const productData = {
    "Bioprocess Engineering": {
        cat: "ENGINEERING",
        desc: "Development of P&ID, PFD, equipment design reviews, functional specifications, and equipment qualification testing for complete process documentation and validation.",
        specs: [
            { label: "Core Focus", value: "Process Engineering Calculations" },
            { label: "Documentation", value: "P&ID, PFD, SFC, Valve Matrices" },
            { label: "Validation", value: "IQ, OQ, and PQ Phase Testing" }
        ]
    },
    "Process Automation": {
        cat: "AUTOMATION",
        desc: "End-to-end process automation engineering, including DCS, SCADA, and PLC solutions. We specialize in ISA 88 Batch Control architectures and compliant Electronic Batch Manufacturing Records (EBMR).",
        specs: [
            { label: "Platform Expertise", value: "Siemens PCS7, TIA, WinCC, Zenon" },
            { label: "Batch Control", value: "ISA 88 Standards" },
            { label: "Enterprise", value: "MES & MOM Solutions Integration" }
        ]
    },
    "Commissioning & Qualification": {
        cat: "VALIDATION",
        desc: "Comprehensive qualification and validation services ensuring regulatory compliance from design to PQ phase, including Contamination Control Strategy (CCS) and CSV/CSA services.",
        specs: [
            { label: "Regulations", value: "GAMP5, 21 CFR Part 11, EU GMP" },
            { label: "Protocols", value: "Design to PQ Phase Documentation" },
            { label: "Assessments", value: "Risk Assessment & CCS" }
        ]
    },
    "Embedded Engineering": {
        cat: "COMPLIANCE",
        desc: "Sustained engineering support for plant operations and maintenance. We provide process optimization, complex troubleshooting, and long-term operational support for pharmaceutical environments.",
        specs: [
            { label: "Support Model", value: "Preventive Maintenance & AMC" },
            { label: "Optimization", value: "Process Inefficiency Resolution" },
            { label: "Regulatory", value: "Data Integrity (ALCOA+) Compliance" }
        ]
    }
};

const detailPanel = document.getElementById('detail-panel');
const closeBtn = document.querySelector('.close-detail');

const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

document.querySelectorAll('.product-item').forEach(item => {
    item.style.cursor = 'none'; // Keep custom cursor control
    item.addEventListener('click', () => {
        const name = item.getAttribute('data-name');
        const data = productData[name];
        if (!data) return;

        document.getElementById('detail-category').textContent = data.cat;
        document.getElementById('detail-title').textContent = name;
        document.getElementById('detail-desc').textContent = data.desc;

        const specBox = document.getElementById('detail-specs');
        specBox.innerHTML = data.specs.map(s => `
            <div class="spec-row">
                <span class="spec-label">${s.label}</span>
                <span class="spec-value">${s.value}</span>
            </div>
        `).join('');

        detailPanel.classList.add('open');
        detailPanel.setAttribute('aria-expanded', 'true');
        
        // Focus Trap
        const focusableContent = detailPanel.querySelectorAll(focusableElements);
        if (focusableContent.length > 0) {
            focusableContent[0].focus();
        }
    });
});

const closePanel = () => {
    detailPanel.classList.remove('open');
    detailPanel.setAttribute('aria-expanded', 'false');
};
closeBtn.addEventListener('click', closePanel);
document.getElementById('cta-detail').addEventListener('click', closePanel);
detailPanel.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePanel();
    } else if (e.key === 'Tab') {
        const focusableContent = detailPanel.querySelectorAll(focusableElements);
        const first = focusableContent[0];
        const last = focusableContent[focusableContent.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }
});

/* ============================
 *  EXPERIMENTAL HOVER GLOW
 * ============================ */
document.querySelectorAll('.product-item').forEach(card => {
    const glow = document.createElement('div');
    glow.className = 'card-glow';
    card.appendChild(glow);

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gsap.to(glow, {
            x: x, y: y,
            duration: 0.4,
            ease: "power2.out",
            opacity: 1,
            overwrite: "auto"
        });
    });
    card.addEventListener('mouseleave', () => {
        gsap.to(glow, { opacity: 0, duration: 0.5 });
    });
});
