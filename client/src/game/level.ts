import * as THREE from 'three';

export class Level {
  private scene: THREE.Scene;
  private levelNumber: number;
  private obstacles: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, levelNumber: number) {
    this.scene = scene;
    this.levelNumber = levelNumber;
  }

  load() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x007700,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Add obstacles based on level number
    this.createObstacles();
  }

  private createObstacles() {
    const obstacleCount = 5 + this.levelNumber * 2; // More obstacles in higher levels

    for (let i = 0; i < obstacleCount; i++) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
      const obstacle = new THREE.Mesh(geometry, material);

      // Random position
      obstacle.position.set(
        Math.random() * 40 - 20,
        1,
        Math.random() * 40 - 20
      );

      this.obstacles.push(obstacle);
      this.scene.add(obstacle);
    }
  }

  getEnemyCount() {
    // Progressive enemy count based on level
    switch (this.levelNumber) {
      case 1:
        return 2; // Starting with 2 enemies
      case 2:
        return 3; // Increasing to 3 enemies
      default:
        return 4; // Levels 3-5 have 4 enemies
    }
  }

  dispose() {
    // Clean up obstacles
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
      obstacle.geometry.dispose();
      (obstacle.material as THREE.Material).dispose();
    });
  }
}