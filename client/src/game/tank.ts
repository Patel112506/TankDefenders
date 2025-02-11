import * as THREE from 'three';
import { Projectile } from './projectile';

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
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    } else {
      this.setNewPatrolPoint();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isPlayer) return;
    this.keys[event.key] = true;

    if (event.key === ' ') {
      this.shoot();
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (!this.isPlayer) return;
    this.keys[event.key] = false;
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isPlayer) return;

    // Calculate rotation based on mouse position relative to center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const angleToMouse = Math.atan2(event.clientX - centerX, centerY - event.clientY);
    this.mesh.rotation.y = angleToMouse;
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

  private updateAI(playerPosition: THREE.Vector3) {
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);

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

    const projectile = new Projectile(
      this.scene,
      projectilePosition,
      this.mesh.rotation.y,
      this.isPlayer
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
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('mousemove', this.handleMouseMove);
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