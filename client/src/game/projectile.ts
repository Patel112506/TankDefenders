import * as THREE from 'three';

export class Projectile {
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private speed = 0.4; 
  private lifetime = 100;
  private damage = 100; // Set damage to 100 per hit
  private isPlayerProjectile: boolean;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, position: THREE.Vector3, rotation: number, isPlayerProjectile: boolean) {
    this.scene = scene;
    const geometry = new THREE.SphereGeometry(0.2);
    const material = new THREE.MeshPhongMaterial({
      color: isPlayerProjectile ? 0x00ff00 : 0xff0000,
      emissive: isPlayerProjectile ? 0x00ff00 : 0xff0000,
      emissiveIntensity: 0.5
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);

    this.velocity = new THREE.Vector3(
      Math.sin(rotation) * this.speed,
      0,
      Math.cos(rotation) * this.speed
    );

    this.isPlayerProjectile = isPlayerProjectile;
    scene.add(this.mesh);
  }

  update() {
    this.mesh.position.add(this.velocity);
    this.lifetime--;
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  getPosition() {
    return this.mesh.position;
  }

  getDamage() {
    return this.damage;
  }

  isPlayerShot() {
    return this.isPlayerProjectile;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}