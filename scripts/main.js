/**
 * Celestial Simulation Script for wbee.me
 *
 * This script generates a highly detailed, physically-inspired, and interactive
 * starfield. It simulates multiple layers of celestial phenomena, including a
 * dynamic starfield with varied star types, a distant rotating galaxy,
 * and realistic comets with particle-based tails.
 *
 * Features:
 * - Corrected 3D perspective projection for a true fullscreen experience.
 * - "Warp Drive" effect on mouse-down, accelerating the starfield.
 * - Subtle parallax and mouse-panning for a deep, immersive feel.
 * - Performance-conscious design to handle high complexity.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) {
        console.error("Canvas element with id 'particle-canvas' not found.");
        return;
    }

    const ctx = canvas.getContext('2d');

    // --- Configuration ---
    const config = {
        STAR_COUNT: (window.innerWidth < 768 ? 560 : 1120) * 5, // Increased star count 
        COMET_SPAWN_INTERVAL: 10000, // ms
        WARP_SPEED_FACTOR: 15,
        MOUSE_PAN_FACTOR: 100, // Inverse; increase for less panning
    };

    let stars = [], comets = [];
    let lastCometSpawn = 0;
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, isDown: false };
    let warpSpeed = 1;
    let currentPanX = 0, currentPanY = 0;

    // --- Utility & Vector Math ---
    const random = (min, max) => Math.random() * (max - min) + min;
    const lerp = (a, b, n) => (1 - n) * a + n * b;

    // --- Event Listeners ---
    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mousedown', () => { mouse.isDown = true; });
        window.addEventListener('mouseup', () => { mouse.isDown = false; });
        window.addEventListener('mouseleave', () => { mouse.isDown = false; });
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    }

    // --- Base Class for Celestial Objects ---
    class CelestialObject {
        constructor(x, y, z) {
            this.pos = { x: x || 0, y: y || 0, z: z || 0 };
        }

        project() {
            const fov = canvas.width * 0.9;
            const scale = fov / (fov + this.pos.z);
            const x2d = this.pos.x * scale + canvas.width / 2;
            const y2d = this.pos.y * scale + canvas.height / 2;
            return { x: x2d, y: y2d, scale };
        }
    }

    // --- Star Class ---
    class Star extends CelestialObject {
        constructor() {
            super(random(-canvas.width, canvas.width), random(-canvas.height, canvas.height), random(1, canvas.width));
            this.radius = Math.max(0.1, (1 - this.pos.z / canvas.width) * 1.8); // Increased size by 20%
            this.alpha = random(0.5, 1); // Increased brightness
            this.twinkleSpeed = random(0.01, 0.03);
            this.twinkle = random(0, Math.PI * 2);
            this.color = `rgba(255, 255, 255, ${this.alpha})`;
        }

        update() {
            this.pos.z -= 0.2 * warpSpeed;
            if (this.pos.z <= 0) {
                this.pos.x = random(-canvas.width, canvas.width);
                this.pos.y = random(-canvas.height, canvas.height);
                this.pos.z = canvas.width;
            }
            this.twinkle += this.twinkleSpeed;
        }

        draw() {
            const { x, y, scale } = this.project();
            if (x < 0 || x > canvas.width || y < 0 || y > canvas.height || scale <= 0) return;
            
            const effectiveAlpha = 0.5 + Math.sin(this.twinkle) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * effectiveAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * scale, 0, Math.PI * 2);
            ctx.fill();

            if (warpSpeed > 5) {
                ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.moveTo(x, y);
                const { x: prevX, y: prevY } = this.project.call({ pos: { ...this.pos, z: this.pos.z + 2 * warpSpeed } });
                ctx.lineTo(prevX, prevY);
                ctx.stroke();
            }
        }
    }

    // --- Comet Class ---
    class Comet extends CelestialObject {
        constructor() {
            super(random(-canvas.width, canvas.width), random(-canvas.height, canvas.height), random(100, canvas.width / 2));
            this.angle = random(0, Math.PI * 2);
            this.speed = random(3, 6);
            this.vel = {
                x: Math.cos(this.angle) * this.speed,
                y: Math.sin(this.angle) * this.speed,
                z: random(-0.5, 0.5)
            };
            this.alpha = 1;
            this.tail = [];
            this.tailLength = 100;
        }

        update() {
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.pos.z += this.vel.z;
            this.alpha -= 0.003;

            this.tail.unshift(new CometParticle({ ...this.pos }));
            if (this.tail.length > this.tailLength) {
                this.tail.pop();
            }
            this.tail.forEach(p => p.update());
        }

        draw() {
            if (this.alpha <= 0) return;
            const { x, y, scale } = this.project();
            if (scale <= 0) return;
            
            // Draw head
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 5 * scale);
            grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Draw tail
            this.tail.forEach(p => p.draw());
        }
    }

    class CometParticle extends CelestialObject {
        constructor(pos) {
            super(pos.x, pos.y, pos.z);
            this.alpha = 1;
            this.radius = 0.5;
        }
        update() { this.alpha -= 0.01; }
        draw() {
            if (this.alpha <= 0) return;
            const { x, y, scale } = this.project();
            if (scale <= 0) return;
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- Main Initialization Function ---
    function init() {
        stars = [];
        comets = [];
        for (let i = 0; i < config.STAR_COUNT; i++) stars.push(new Star());
    }

    // --- Main Animation Loop ---
    function animate(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Handle warp speed
        const targetWarp = mouse.isDown ? config.WARP_SPEED_FACTOR : 1;
        warpSpeed = lerp(warpSpeed, targetWarp, 0.05);

        // Handle mouse panning
        const targetPanX = (mouse.x - canvas.width / 2) / config.MOUSE_PAN_FACTOR;
        const targetPanY = (mouse.y - canvas.height / 2) / config.MOUSE_PAN_FACTOR;
        currentPanX = lerp(currentPanX, targetPanX, 0.05);
        currentPanY = lerp(currentPanY, targetPanY, 0.05);

        ctx.save();
        ctx.translate(-currentPanX, -currentPanY);

        // Update and draw all objects
        stars.forEach(s => { s.update(); s.draw(); });
        comets.forEach(c => { c.update(); c.draw(); });
        
        ctx.restore();

        // Spawn comets periodically
        if (timestamp - lastCometSpawn > config.COMET_SPAWN_INTERVAL) {
            comets.push(new Comet());
            lastCometSpawn = timestamp;
        }
        comets = comets.filter(c => c.alpha > 0);

        requestAnimationFrame(animate);
    }

    // --- Start ---
    setupEventListeners();
    resizeCanvas();
    requestAnimationFrame(animate);

    /// --- 2. VIVUS SVG ANIMATION ---
    // This uses the Vivus library to load and animate your external SVG file.
    new Vivus('avatar-container', {
        type: 'oneByOne',        // Draws each path sequentially for a "live sketch" feel.
        duration: 300,           // Total animation duration in frames.
        file: 'assets/images/profile.svg', // The path to your corrected SVG file.
        start: 'autostart',      // Start the animation automatically on page load.
        onReady: function (myVivus) {
          // This function runs once the SVG is loaded.
          // It makes the SVG responsive by removing fixed dimensions.
          const svg = myVivus.el;
          svg.setAttribute('class', 'w-full max-w-sm'); // Apply TailwindCSS classes for sizing.
          svg.removeAttribute('width');
          svg.removeAttribute('height');
        }
    });
});
