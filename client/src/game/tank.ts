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
  private joystickMovement: { angle: number; force: number } | null = null;

  constructor(scene: THREE.Scene, isPlayer: boolean) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    // Different speeds for player and enemies
    this.speed = isPlayer ? 6 : 0.15; // Adjusted to move about 2x tank length per press
    this.rotationSpeed = isPlayer ? 0.25 : 0.04;
    // Different health values for player and enemies
    this.health = isPlayer ? 500 : 300; // Player: 500 HP, Enemies: 300 HP
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

    if (!isPlayer) {
      this.setNewPatrolPoint();
    }
  }

  handleJoystickInput(data: { angle: number; force: number } | null) {
    if (this.isPlayer) {
      this.joystickMovement = data;
    }
  }

  handleInput(event: KeyboardEvent) {
    if (!this.isPlayer) return;

    if (event.type === 'keydown' && event.key === ' ') {
      this.shoot();
    }
  }

  update(playerPosition?: THREE.Vector3) {
    // Handle joystick movement for player
    if (this.isPlayer && this.joystickMovement) {
      const { angle, force } = this.joystickMovement;

      // Instant rotation for more responsive control
      this.mesh.rotation.y = angle;

      // Move tank forward based on joystick force
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(this.mesh.quaternion);
      this.mesh.position.add(direction.multiplyScalar(this.speed * force));
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

    // AI behavior for enemy tanks
    if (!this.isPlayer && playerPosition) {
      this.updateAI(playerPosition);
    }
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
    this.health -= amount; // Changed to deduct the actual amount of damage
    if (this.health < 0) this.health = 0; //Health cannot go below 0
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