import { PROJECTILE_SIZE, incrementScore } from './config.js';

class Projectile {
    constructor(x, y, speed, splashRadius) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.splashRadius = splashRadius;
        this.size = PROJECTILE_SIZE;
    }

    fire(targetX, targetY) {
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    explode(enemies, collidedEnemyIndex, splashEffects) {
        if (this.splashRadius > 0) {
            // Create splash effect
            splashEffects.push(new SplashEffect(this.x, this.y, this.splashRadius));
            
            // Splash damage
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.splashRadius) {
                    enemies.splice(i, 1);
                    incrementScore(10);
                }
            }
        } else {
            // Direct hit only
            if (collidedEnemyIndex !== undefined) {
                enemies.splice(collidedEnemyIndex, 1);
                incrementScore(10);
            }
        }
    }
}

class SplashEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.duration = 60; // Duration in frames (60 frames = 1 second at 60 FPS)
        this.currentFrame = 0;
    }

    update() {
        this.currentFrame++;
        this.radius = this.maxRadius * (1 - this.currentFrame / this.duration);
    }

    draw(ctx, cameraX, cameraY) {
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 0, ${1 - this.currentFrame / this.duration})`;
        ctx.stroke();
    }

    isFinished() {
        return this.currentFrame >= this.duration;
    }
}

const projectileTypes = [
    { name: 'Standard', speed: 5, splashRadius: 0 },
    { name: 'Fast', speed: 8, splashRadius: 0 },
    { name: 'Explosive', speed: 3, splashRadius: 30 }
];

export { Projectile, projectileTypes, SplashEffect };