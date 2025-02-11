import * as THREE from 'three';
import { Projectile } from './projectile';

enum PowerUpType {
  Health,
  Attack
}

export class Tank {
  private speed: number;
  private rotationSpeed: number;
  private health: number;
  private projectiles: Projectile[] = [];
  private isPlayer: boolean;
  private scene: THREE.Scene;
  private lastShootTime = 0;
  private shootCooldown = 500; // milliseconds
  private state: 'patrol' | 'chase' | 'attack' = 'patrol';
  private patrolPoint: THREE.Vector3 = new THREE.Vector3();
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private detectionRange = 15;
  private attackRange = 10;
  private keys: { [key: string]: boolean } = {};
  private attackBoostActive = false;
  private attackBoostEndTime = 0;
  private baseProjectileDamage = 120; // Base damage for player projectiles

  handleInput(event: KeyboardEvent) {
    if (!this.isPlayer) return;
    this.handleKeyDown(event);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.isPlayer) return;
    this.keys[event.key] = true;

    if (event.key === ' ') {
      this.shoot();
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    if (!this.isPlayer) return;
    this.keys[event.key] = false;
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.isPlayer) return;

    // Calculate rotation based on mouse position relative to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const angleToMouse = Math.atan2(event.clientX - centerX, centerY - event.clientY);
    this.mesh.rotation.y = angleToMouse;
  }

  constructor(scene: THREE.Scene, isPlayer: boolean) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    // Different speeds for player and enemies
    this.speed = isPlayer ? 0.4 : 0.15; // Adjusted for arrow key movement
    this.rotationSpeed = isPlayer ? 0.3 : 0.04;
    this.health = isPlayer ? 500 : 300;
    this.mesh = new THREE.Group();

    // Tank body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: isPlayer ? 0x00ff00 : 0xff0000
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);

    // Tank turret
    const turretGeometry = new THREE.BoxGeometry(1, 0.5, 1.5);
    const turretMaterial = new THREE.MeshPhongMaterial({
      color: isPlayer ? 0x008800 : 0x880000
    });
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 0.75;
    this.mesh.add(turret);

    // Tank cannon
    const cannonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const cannonMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333
    });
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.set(0, 0.75, 1);
    this.mesh.add(cannon);

    scene.add(this.mesh);

    if (isPlayer) {
      // Set up keyboard controls for player
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
      window.addEventListener('keyup', this.handleKeyUp.bind(this));
      window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    } else {
      this.setNewPatrolPoint();
    }
  }

  applyPowerUp(type: PowerUpType) {
    switch (type) {
      case PowerUpType.Health:
        if (this.health < 500) {
          this.health = Math.min(500, this.health + 200);
        }
        break;
      case PowerUpType.Attack:
        this.attackBoostActive = true;
        this.attackBoostEndTime = Date.now() + 30000; // 30 seconds
        break;
    }
  }

  update(playerPosition?: THREE.Vector3) {
    if (this.isPlayer) {
      // Handle keyboard movement
      const moveSpeed = this.speed;
      if (this.keys['ArrowUp'] || this.keys['w']) {
        this.mesh.position.z -= moveSpeed;
      }
      if (this.keys['ArrowDown'] || this.keys['s']) {
        this.mesh.position.z += moveSpeed;
      }
      if (this.keys['ArrowLeft'] || this.keys['a']) {
        this.mesh.position.x -= moveSpeed;
      }
      if (this.keys['ArrowRight'] || this.keys['d']) {
        this.mesh.position.x += moveSpeed;
      }
    } else if (playerPosition) {
      this.updateAI(playerPosition);
    }

    // Check if attack boost has expired
    if (this.attackBoostActive && Date.now() > this.attackBoostEndTime) {
      this.attackBoostActive = false;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter(projectile => {
      projectile.update();
      if (projectile.isExpired()) {
        projectile.dispose();
        return false;
      }
      return true;
    });
  }

  setAIDifficulty(level: number) {
    if (!this.isPlayer) {
      // Adjust detection and attack ranges based on level
      this.detectionRange = 10 + level * 2; // Increases from 12 to 20
      this.attackRange = 5 + level * 1.5; // Increases from 6.5 to 12.5

      // Adjust movement speed based on level
      this.speed = 0.1 + (level * 0.02); // Increases from 0.12 to 0.2

      // Adjust shooting frequency based on level
      switch (level) {
        case 1:
          this.shootCooldown = 2000; // 2 seconds between shots
          this.baseProjectileDamage = 80; // Lower damage at start
          this.health = 200; // Lower health at start
          break;
        case 2:
          this.shootCooldown = 1500; // 1.5 seconds
          this.baseProjectileDamage = 90;
          this.health = 250;
          break;
        case 3:
          this.shootCooldown = 1000; // 1 second
          this.baseProjectileDamage = 100;
          this.health = 300;
          break;
        case 4:
          this.shootCooldown = 800; // 0.8 seconds
          this.baseProjectileDamage = 110;
          this.health = 300;
          break;
        case 5:
          this.shootCooldown = 600; // 0.6 seconds
          this.baseProjectileDamage = 120; // Maximum damage
          this.health = 400; // Stronger in final level
          break;
      }
    }
  }

  private updateAI(playerPosition: THREE.Vector3) {
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);

    // More aggressive behavior in higher levels (controlled by detection and attack ranges)
    if (distanceToPlayer <= this.attackRange) {
      this.state = 'attack';
      this.targetPosition.copy(playerPosition);
    } else if (distanceToPlayer <= this.detectionRange) {
      this.state = 'chase';
      this.targetPosition.copy(playerPosition);
    } else if (this.mesh.position.distanceTo(this.patrolPoint) < 1) {
      this.setNewPatrolPoint();
      this.state = 'patrol';
      this.targetPosition.copy(this.patrolPoint);
    }

    switch (this.state) {
      case 'patrol':
        this.moveTowardsTarget(this.patrolPoint);
        if (Math.random() < 0.005) this.shoot();
        break;
      case 'chase':
        this.moveTowardsTarget(playerPosition);
        if (Math.random() < 0.01) this.shoot();
        break;
      case 'attack':
        this.moveTowardsTarget(playerPosition);
        if (Math.random() < 0.03) this.shoot();
        break;
    }
  }

  private moveTowardsTarget(target: THREE.Vector3) {
    const direction = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .normalize();
    const angleToTarget = Math.atan2(direction.x, direction.z);
    const currentAngle = this.mesh.rotation.y;
    const angleDiff = (angleToTarget - currentAngle + Math.PI) % (Math.PI * 2) - Math.PI;

    if (Math.abs(angleDiff) > 0.1) {
      this.rotate(Math.sign(angleDiff) * this.rotationSpeed);
    } else {
      this.moveForward();
    }
  }

  private setNewPatrolPoint() {
    this.patrolPoint.set(
      Math.random() * 40 - 20,
      0,
      Math.random() * 40 - 20
    );
  }

  private moveForward() {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.mesh.quaternion);
    this.mesh.position.add(direction.multiplyScalar(this.speed));
  }

  private moveBackward() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    this.mesh.position.add(direction.multiplyScalar(this.speed));
  }

  private rotate(angle: number) {
    this.mesh.rotation.y += angle;
  }

  shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      return;
    }

    const projectilePosition = new THREE.Vector3();
    this.mesh.getWorldPosition(projectilePosition);
    projectilePosition.y += 0.75;

    // Calculate damage with attack boost
    let damage = this.baseProjectileDamage;
    if (this.attackBoostActive) {
      if (currentTime > this.attackBoostEndTime) {
        this.attackBoostActive = false;
      } else {
        damage *= 1.5; // 50% damage boost
      }
    }

    const projectile = new Projectile(
      this.scene,
      projectilePosition,
      this.mesh.rotation.y,
      this.isPlayer,
      damage
    );

    this.projectiles.push(projectile);
    this.lastShootTime = currentTime;
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    return this.health <= 0;
  }

  getHealth() {
    return this.health;
  }

  getPosition() {
    return this.mesh.position;
  }

  setPosition(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
  }

  getProjectiles() {
    return this.projectiles;
  }

  dispose() {
    if (this.isPlayer) {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
      window.removeEventListener('keyup', this.handleKeyUp.bind(this));
      window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    }
    this.projectiles.forEach(projectile => projectile.dispose());
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }

  private mesh: THREE.Group;
}