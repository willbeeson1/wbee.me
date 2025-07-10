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
        STAR_COUNT: window.innerWidth < 768 ? 400 : 800,
        GALAXY_STAR_COUNT: 1500,
        COMET_SPAWN_INTERVAL: 20000, // ms
        WARP_SPEED_FACTOR: 15,
        MOUSE_PAN_FACTOR: 20, // Increased from 15 to reduce sensitivity
    };

    let stars = [], galaxy = [], comets = [];
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
            this.radius = Math.max(0.1, (1 - this.pos.z / canvas.width) * 1.5);
            this.alpha = random(0.3, 1);
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

    // --- Galaxy Class (for distant dust lane) ---
    class GalaxyStar extends CelestialObject {
        constructor() {
            const angle = random(0, Math.PI * 2);
            const radius = random(0, canvas.width * 2) * Math.pow(random(0, 1), 2);
            super(Math.cos(angle) * radius, random(-50, 50), Math.sin(angle) * radius);
            this.radius = 0.5;
            this.alpha = random(0.05, 0.2);
            this.color = `rgba(200, 220, 255, ${this.alpha})`;
        }

        update() {
            // Slow rotation
            const rotSpeed = 0.00005;
            const cos = Math.cos(rotSpeed);
            const sin = Math.sin(rotSpeed);
            const newX = this.pos.x * cos - this.pos.z * sin;
            const newZ = this.pos.x * sin + this.pos.z * cos;
            this.pos.x = newX;
            this.pos.z = newZ;
        }

        draw() {
            const { x, y, scale } = this.project();
            if (x < 0 || x > canvas.width || y < 0 || y > canvas.height || scale <= 0) return;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * scale, 0, Math.PI * 2);
            ctx.fill();
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
        galaxy = [];
        comets = [];
        for (let i = 0; i < config.STAR_COUNT; i++) stars.push(new Star());
        for (let i = 0; i < config.GALAXY_STAR_COUNT; i++) galaxy.push(new GalaxyStar());
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
        galaxy.forEach(g => { g.update(); g.draw(); });
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
});
