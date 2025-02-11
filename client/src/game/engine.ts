import * as THREE from 'three';
import { Tank } from './tank';
import { Level } from './level';
import { PowerUp } from './powerup';
import { UI } from './ui';

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private playerTank: Tank;
  private enemies: Tank[] = [];
  private powerUps: PowerUp[] = [];
  private currentLevel: Level;
  private ui: UI;
  private isPaused: boolean = false;
  private raycaster: THREE.Raycaster;

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // Camera initial position
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Initialize game objects
    this.playerTank = new Tank(this.scene, true);
    this.currentLevel = new Level(this.scene, 1);
    this.ui = new UI();
    this.raycaster = new THREE.Raycaster();

    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', this.handleInput.bind(this));
  }

  init() {
    this.currentLevel.load();
    this.spawnEnemies();
    this.animate();
  }

  private spawnEnemies() {
    const enemyCount = this.currentLevel.getEnemyCount();
    for (let i = 0; i < enemyCount; i++) {
      const enemy = new Tank(this.scene, false);
      enemy.setPosition(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
      this.enemies.push(enemy);
    }
  }

  private handleInput(event: KeyboardEvent) {
    if (!this.isPaused) {
      this.playerTank.handleInput(event);
    }
    if (event.key === 'Escape') {
      this.togglePause();
    }
  }

  private checkProjectileCollisions() {
    // Check player projectiles against enemies
    this.playerTank.getProjectiles().forEach(projectile => {
      const projectilePos = projectile.getPosition();
      this.enemies.forEach((enemy, index) => {
        const enemyPos = enemy.getPosition();
        const distance = projectilePos.distanceTo(enemyPos);
        if (distance < 2) { // Hit radius
          if (enemy.takeDamage(projectile.getDamage())) {
            enemy.dispose();
            this.enemies.splice(index, 1);
          }
          projectile.dispose();
        }
      });
    });

    // Check enemy projectiles against player
    this.enemies.forEach(enemy => {
      enemy.getProjectiles().forEach(projectile => {
        const projectilePos = projectile.getPosition();
        const playerPos = this.playerTank.getPosition();
        const distance = projectilePos.distanceTo(playerPos);
        if (distance < 2) { // Hit radius
          if (this.playerTank.takeDamage(projectile.getDamage())) {
            // Game Over
            this.ui.showGameOver();
            this.isPaused = true;
          }
          projectile.dispose();
        }
      });
    });
  }

  private animate() {
    if (this.isPaused) return;

    requestAnimationFrame(this.animate.bind(this));

    // Update game objects
    this.playerTank.update();
    this.enemies.forEach(enemy => enemy.update());
    this.powerUps.forEach(powerUp => powerUp.update());
    this.checkProjectileCollisions();

    // Update camera to follow player
    const playerPos = this.playerTank.getPosition();
    this.camera.position.set(
      playerPos.x, 
      playerPos.y + 10,
      playerPos.z + 20
    );
    this.camera.lookAt(playerPos);

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  pause() {
    this.togglePause();
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.animate();
    }
  }

  dispose() {
    // Clean up resources
    this.playerTank.dispose();
    this.enemies.forEach(enemy => enemy.dispose());
    this.powerUps.forEach(powerUp => powerUp.dispose());
    this.currentLevel.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.handleInput);
  }
}