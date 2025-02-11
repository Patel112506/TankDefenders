import * as THREE from 'three';
import { Tank } from './tank';
import { Level } from './level';
import { PowerUp, PowerUpType } from './powerup';
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
  private powerUpSpawnInterval = 15000; // Spawn power-up every 15 seconds
  private lastPowerUpSpawn = 0;
  private moonLight: THREE.DirectionalLight;

  constructor(container: HTMLElement) {
    // Scene setup with dark sky
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000010); // Very dark blue

    // Add fog for night atmosphere
    this.scene.fog = new THREE.Fog(0x000010, 50, 200);

    // Camera setup with wider FOV for better night vision
    this.camera = new THREE.PerspectiveCamera(
      85,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Enhanced renderer with better shadows
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Initial camera position
    this.camera.position.set(0, 15, 30);
    this.camera.lookAt(0, 0, 0);

    // Nighttime lighting setup
    const ambientLight = new THREE.AmbientLight(0x111122, 0.3); // Dim blue ambient light
    this.scene.add(ambientLight);

    // Moon light
    this.moonLight = new THREE.DirectionalLight(0x6666ff, 0.8);
    this.moonLight.position.set(100, 100, 50);
    this.moonLight.castShadow = true;
    this.scene.add(this.moonLight);

    // Add subtle hemisphere light for better terrain visibility
    const hemisphereLight = new THREE.HemisphereLight(0x000066, 0x000000, 0.3);
    this.scene.add(hemisphereLight);

    // Initialize game objects
    this.playerTank = new Tank(this.scene, true);
    this.currentLevel = new Level(this.scene, this.levelNumber);
    this.ui = new UI();
    this.raycaster = new THREE.Raycaster();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setUICallbacks(callbacks: UICallbacks) {
    this.uiCallbacks = callbacks;
  }

  init() {
    this.currentLevel.load();
    this.spawnEnemies();
    // Add event listener for keyboard input
    document.addEventListener('keydown', this.handleInput.bind(this));
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

      // Adjust AI based on level
      enemy.setAIDifficulty(this.levelNumber);

      this.enemies.push(enemy);
    }
  }

  private spawnPowerUp() {
    const randomType = Math.random() < 0.5 ? PowerUpType.Health : PowerUpType.Attack;
    const position = new THREE.Vector3(
      Math.random() * 40 - 20,
      1,
      Math.random() * 40 - 20
    );
    const powerUp = new PowerUp(this.scene, randomType, position);
    this.powerUps.push(powerUp);
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
    if (this.isPaused) return;
    this.playerTank?.handleKeyDown(event);
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

    // Check power-up collisions
    this.powerUps = this.powerUps.filter(powerUp => {
      if (powerUp.isCollected()) return false;

      const powerUpPos = powerUp.getPosition();
      const playerPos = this.playerTank.getPosition();
      const distance = powerUpPos.distanceTo(playerPos);

      if (distance < 2) { // Collection radius
        this.playerTank.applyPowerUp(powerUp.getType());
        powerUp.collect();
        return false;
      }
      return true;
    });
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
          const isDead = this.playerTank.takeDamage(projectile.getDamage());
          this.updateUI();
          if (isDead && this.uiCallbacks) {
            this.uiCallbacks.onGameOver();
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

    const currentTime = Date.now();
    if (currentTime - this.lastPowerUpSpawn > this.powerUpSpawnInterval) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = currentTime;
    }

    // Update moon position for dynamic shadows
    const time = currentTime * 0.0001;
    this.moonLight.position.x = Math.cos(time) * 100;
    this.moonLight.position.z = Math.sin(time) * 100;

    const playerPos = this.playerTank.getPosition();
    this.playerTank.update();
    this.enemies.forEach(enemy => enemy.update(playerPos));
    this.powerUps.forEach(powerUp => powerUp.update());

    this.checkCollisions();
    this.checkProjectileCollisions();

    // Updated camera follow with higher elevation for better visibility
    this.camera.position.set(
      playerPos.x,
      playerPos.y + 25, // Higher elevation for better visibility
      playerPos.z + 40  // Further back
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
    // Remove event listener
    document.removeEventListener('keydown', this.handleInput.bind(this));
    window.removeEventListener('resize', this.onWindowResize);
  }

  getPlayerTank() {
    return this.playerTank;
  }

  getEnemyPositions() {
    return this.enemies.map(enemy => enemy.getPosition());
  }
}