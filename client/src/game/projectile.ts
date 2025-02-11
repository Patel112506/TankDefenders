import * as THREE from 'three';

export class Projectile {
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private speed = 0.5;
  private lifetime = 100;
  private damage = 25;
  private isPlayerProjectile: boolean;

  constructor(position: THREE.Vector3, rotation: number, isPlayerProjectile: boolean) {
    const geometry = new THREE.SphereGeometry(0.2);
    const material = new THREE.MeshPhongMaterial({
      color: isPlayerProjectile ? 0x00ff00 : 0xff0000,
      emissive: isPlayerProjectile ? 0x00ff00 : 0xff0000,
      emissiveIntensity: 0.5
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    // Calculate velocity based on rotation
    this.velocity = new THREE.Vector3(
      Math.sin(rotation) * this.speed,
      0,
      Math.cos(rotation) * this.speed
    );
    
    this.isPlayerProjectile = isPlayerProjectile;
  }

  update() {
    // Move projectile
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

  dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
