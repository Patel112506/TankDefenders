import * as THREE from 'three';

export enum PowerUpType {
  Health,
  Speed,
  Damage
}

export class PowerUp {
  private mesh: THREE.Mesh;
  private type: PowerUpType;
  private rotationSpeed = 0.02;
  private bounceHeight = 0.2;
  private bounceSpeed = 0.02;
  private time = 0;

  constructor(scene: THREE.Scene, type: PowerUpType, position: THREE.Vector3) {
    this.type = type;

    // Create power-up mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
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
        return 0xff0000;
      case PowerUpType.Speed:
        return 0x00ff00;
      case PowerUpType.Damage:
        return 0x0000ff;
    }
  }

  update() {
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

  collect() {
    // Remove from scene when collected
    this.mesh.parent?.remove(this.mesh);
  }
}
