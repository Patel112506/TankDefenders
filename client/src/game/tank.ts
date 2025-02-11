import * as THREE from 'three';
import { Projectile } from './projectile';

export class Tank {
  private mesh: THREE.Group;
  private speed = 0.1;
  private rotationSpeed = 0.05;
  private health = 100;
  private projectiles: Projectile[] = [];
  private isPlayer: boolean;

  constructor(scene: THREE.Scene, isPlayer: boolean) {
    this.isPlayer = isPlayer;
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
  }

  handleInput(event: KeyboardEvent) {
    if (!this.isPlayer) return;

    switch (event.key) {
      case 'w':
        this.moveForward();
        break;
      case 's':
        this.moveBackward();
        break;
      case 'a':
        this.rotate(-this.rotationSpeed);
        break;
      case 'd':
        this.rotate(this.rotationSpeed);
        break;
      case ' ':
        this.shoot();
        break;
    }
  }

  update() {
    // Update projectiles
    this.projectiles = this.projectiles.filter(projectile => {
      projectile.update();
      return !projectile.isExpired();
    });

    // AI behavior for enemy tanks
    if (!this.isPlayer) {
      this.updateAI();
    }
  }

  private updateAI() {
    // Simple AI: move randomly and shoot occasionally
    if (Math.random() < 0.02) {
      this.rotate(Math.random() * this.rotationSpeed * 2 - this.rotationSpeed);
    }
    if (Math.random() < 0.01) {
      this.shoot();
    }
    this.moveForward();
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

  private shoot() {
    const projectile = new Projectile(
      this.mesh.position.clone(),
      this.mesh.rotation.y,
      this.isPlayer
    );
    this.projectiles.push(projectile);
  }

  takeDamage(amount: number) {
    this.health -= amount;
    return this.health <= 0;
  }

  getPosition() {
    return this.mesh.position;
  }

  setPosition(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
  }
}
