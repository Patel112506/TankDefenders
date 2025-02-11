import * as THREE from 'three';

export enum PowerUpType {
  Health,
  Attack
}

export class PowerUp {
  private mesh: THREE.Mesh;
  private type: PowerUpType;
  private rotationSpeed = 0.02;
  private bounceHeight = 0.2;
  private bounceSpeed = 0.02;
  private time = 0;
  private duration = 30000; // 30 seconds for attack boost
  private collected = false;

  constructor(scene: THREE.Scene, type: PowerUpType, position: THREE.Vector3) {
    this.type = type;

    // Create power-up mesh with distinct shapes for each type
    let geometry: THREE.BufferGeometry;
    if (type === PowerUpType.Health) {
      // Heart-like shape for health (cube with red color)
      geometry = new THREE.BoxGeometry(1, 1, 1);
    } else {
      // Octahedron for attack boost
      geometry = new THREE.OctahedronGeometry(0.7);
    }

    const material = new THREE.MeshPhongMaterial({
      color: this.getColorForType(),
      emissive: this.getColorForType(),
      emissiveIntensity: 0.5
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  private getColorForType(): number {
    switch (this.type) {
      case PowerUpType.Health:
        return 0xff0000; // Red for health
      case PowerUpType.Attack:
        return 0xffff00; // Yellow for attack boost
    }
  }

  update() {
    if (this.collected) return;

    // Rotate the power-up
    this.mesh.rotation.y += this.rotationSpeed;

    // Make it bounce
    this.time += this.bounceSpeed;
    this.mesh.position.y = 1 + Math.sin(this.time) * this.bounceHeight;
  }

  getType() {
    return this.type;
  }

  getPosition() {
    return this.mesh.position;
  }

  isCollected() {
    return this.collected;
  }

  getDuration() {
    return this.duration;
  }

  collect() {
    this.collected = true;
    // Remove from scene when collected
    this.mesh.parent?.remove(this.mesh);
  }

  dispose() {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
}