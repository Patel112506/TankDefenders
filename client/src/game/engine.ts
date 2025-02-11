import * as THREE from 'three';
import { Tank } from './tank';
import { Level } from './level';
import { PowerUp } from './powerup';
import { UI } from './ui';

interface UICallbacks {
  onScoreUpdate: (score: number) => void;
  onLevelUpdate: (level: number) => void;
  onHealthUpdate: (health: number) => void;
  onGameOver: () => void;
  onLevelComplete: () => void;
}

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
  private collisionMargin = 1.5;
  private levelNumber: number = 1;
  private uiCallbacks?: UICallbacks;

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
    this.currentLevel = new Level(this.scene, this.levelNumber);
    this.ui = new UI();
    this.raycaster = new THREE.Raycaster();

    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('keydown', this.handleInput.bind(this));
  }

  setUICallbacks(callbacks: UICallbacks) {
    this.uiCallbacks = callbacks;
  }

  init() {
    this.currentLevel.load();
    this.spawnEnemies();
    this.animate();
    this.updateUI();
  }

  private updateUI() {
    if (this.uiCallbacks) {
      this.uiCallbacks.onScoreUpdate(this.ui.getScore());
      this.uiCallbacks.onLevelUpdate(this.levelNumber);
      this.uiCallbacks.onHealthUpdate(this.ui.getHealth());
    }
  }

  private spawnEnemies() {
    const enemyCount = this.currentLevel.getEnemyCount();
    for (let i = 0; i < enemyCount; i++) {
      const enemy = new Tank(this.scene, false);
      const angle = (Math.PI * 2 * i) / enemyCount;
      const radius = 15 + Math.random() * 5;
      enemy.setPosition(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      this.enemies.push(enemy);
    }
  }

  startNextLevel() {
    this.levelNumber++;
    this.currentLevel.dispose();
    this.enemies.forEach(enemy => enemy.dispose());
    this.enemies = [];

    this.currentLevel = new Level(this.scene, this.levelNumber);
    this.currentLevel.load();
    this.spawnEnemies();

    this.isPaused = false;
    this.animate();
    this.updateUI();
  }

  restart() {
    this.levelNumber = 1;
    this.currentLevel.dispose();
    this.enemies.forEach(enemy => enemy.dispose());
    this.enemies = [];

    this.ui = new UI();
    this.currentLevel = new Level(this.scene, this.levelNumber);
    this.currentLevel.load();
    this.spawnEnemies();

    this.isPaused = false;
    this.animate();
    this.updateUI();
  }

  private handleInput(event: KeyboardEvent) {
    if (!this.isPaused) {
      this.playerTank.handleInput(event);
    }
    if (event.key === 'Escape') {
      this.togglePause();
    }
  }

  private checkCollisions() {
    const playerPos = this.playerTank.getPosition();

    // Check tank collisions
    for (const enemy of this.enemies) {
      const enemyPos = enemy.getPosition();
      const distance = playerPos.distanceTo(enemyPos);

      if (distance < this.collisionMargin * 2) {
        const direction = new THREE.Vector3()
          .subVectors(playerPos, enemyPos)
          .normalize();
        const pushDistance = (this.collisionMargin * 2 - distance) / 2;

        playerPos.add(direction.multiplyScalar(pushDistance));
        enemyPos.add(direction.multiplyScalar(-pushDistance));

        this.playerTank.setPosition(playerPos.x, playerPos.y, playerPos.z);
        enemy.setPosition(enemyPos.x, enemyPos.y, enemyPos.z);
      }
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
            this.ui.updateScore(100);
            this.updateUI();

            if (this.enemies.length === 0) {
              if (this.uiCallbacks) {
                this.uiCallbacks.onLevelComplete();
              }
              this.isPaused = true;
            }
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
            if (this.uiCallbacks) {
              this.uiCallbacks.onGameOver();
            }
            this.isPaused = true;
          }
          this.updateUI();
          projectile.dispose();
        }
      });
    });
  }

  private animate() {
    if (this.isPaused) return;

    requestAnimationFrame(this.animate.bind(this));

    const playerPos = this.playerTank.getPosition();
    this.playerTank.update();
    this.enemies.forEach(enemy => enemy.update(playerPos));
    this.powerUps.forEach(powerUp => powerUp.update());

    this.checkCollisions();
    this.checkProjectileCollisions();

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
    this.playerTank.dispose();
    this.enemies.forEach(enemy => enemy.dispose());
    this.powerUps.forEach(powerUp => powerUp.dispose());
    this.currentLevel.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.handleInput);
  }
}