import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface TerrainPoint {
  elevation: number;
  type: 'grass' | 'dirt' | 'sand';
}

export class Level {
  private scene: THREE.Scene;
  private levelNumber: number;
  private obstacles: THREE.Mesh[] = [];
  private mapSize = 100; // Increased map size
  private terrainResolution = 100;
  private terrain!: THREE.Mesh;
  private decorations: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, levelNumber: number) {
    this.scene = scene;
    this.levelNumber = levelNumber;
  }

  load() {
    // Generate terrain data
    const terrainData = this.generateTerrainData();

    // Create ground with elevation
    const groundGeometry = new THREE.PlaneGeometry(
      this.mapSize,
      this.mapSize,
      this.terrainResolution - 1,
      this.terrainResolution - 1
    );

    // Apply elevation to vertices
    const positions = groundGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor((i / 3) % this.terrainResolution);
      const z = Math.floor((i / 3) / this.terrainResolution);
      positions[i + 1] = terrainData[z][x].elevation * 3; // Amplify elevation for more dramatic hills
    }
    groundGeometry.computeVertexNormals();

    // Create blended terrain texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('/textures/grass.jpg');
    const dirtTexture = textureLoader.load('/textures/dirt.jpg');
    const sandTexture = textureLoader.load('/textures/sand.jpg');

    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;

    grassTexture.repeat.set(20, 20);
    dirtTexture.repeat.set(20, 20);
    sandTexture.repeat.set(20, 20);

    // Create custom shader material for terrain blending
    const groundMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Apply vertex colors based on height and slope
    const colors = new Float32Array(positions.length);
    const normal = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 1];
      const x = Math.floor((i / 3) % this.terrainResolution);
      const z = Math.floor((i / 3) / this.terrainResolution);

      // Calculate slope using normal
      normal.set(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      ).normalize();
      const slope = 1 - normal.dot(new THREE.Vector3(0, 1, 0));

      // Color based on height and slope
      let color = new THREE.Color();
      if (height > 2) {
        // Snow on high peaks
        color.setRGB(0.95, 0.95, 0.95);
      } else if (height > 1 || slope > 0.5) {
        // Rocky/dirt on steep slopes or medium height
        color.setRGB(0.6, 0.5, 0.4);
      } else if (height > 0) {
        // Grass on normal terrain
        color.setRGB(0.2, 0.6, 0.2);
      } else {
        // Sand in valleys
        color.setRGB(0.8, 0.7, 0.5);
      }

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    // Add decorative elements
    this.addDecorations(terrainData);

    // Add obstacles based on level number
    this.createObstacles();
  }

  private generateTerrainData(): TerrainPoint[][] {
    const terrain: TerrainPoint[][] = [];
    const noise2D = createNoise2D();

    for (let z = 0; z < this.terrainResolution; z++) {
      terrain[z] = [];
      for (let x = 0; x < this.terrainResolution; x++) {
        const nx = x / this.terrainResolution - 0.5;
        const nz = z / this.terrainResolution - 0.5;

        // Generate elevation using multiple octaves of noise for more detail
        let elevation = 0;
        elevation += noise2D(nx * 2, nz * 2) * 1.0;  // Large features
        elevation += noise2D(nx * 4, nz * 4) * 0.5;  // Medium features
        elevation += noise2D(nx * 8, nz * 8) * 0.25; // Small features
        elevation += noise2D(nx * 16, nz * 16) * 0.125; // Fine details

        // Add some crater-like formations
        const distance = Math.sqrt(nx * nx + nz * nz) * 3;
        elevation -= Math.exp(-distance * distance) * 0.5;

        // Determine terrain type based on elevation and noise
        let type: 'grass' | 'dirt' | 'sand';
        if (elevation > 0.6) {
          type = 'dirt';
        } else if (elevation > 0) {
          type = 'grass';
        } else {
          type = 'sand';
        }

        terrain[z][x] = { elevation, type };
      }
    }

    return terrain;
  }

  private addDecorations(terrainData: TerrainPoint[][]) {
    // Add rocks
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < 50; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      const x = Math.random() * this.mapSize - this.mapSize / 2;
      const z = Math.random() * this.mapSize - this.mapSize / 2;

      // Find the elevation at this point
      const terrainX = Math.floor((x + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const terrainZ = Math.floor((z + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const elevation = terrainData[terrainZ][terrainX].elevation * 3; // Match the amplified terrain

      rock.position.set(x, elevation + 0.5, z);
      rock.scale.set(
        0.5 + Math.random() * 1.5,
        0.5 + Math.random() * 1.5,
        0.5 + Math.random() * 1.5
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      this.decorations.push(rock);
      this.scene.add(rock);
    }
  }

  private createObstacles() {
    const obstacleCount = 5 + this.levelNumber * 2;

    for (let i = 0; i < obstacleCount; i++) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
      const obstacle = new THREE.Mesh(geometry, material);

      // Random position within the larger map
      obstacle.position.set(
        Math.random() * (this.mapSize - 10) - (this.mapSize / 2 - 5),
        1,
        Math.random() * (this.mapSize - 10) - (this.mapSize / 2 - 5)
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

  getMapSize() {
    return this.mapSize;
  }

  dispose() {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }

    // Clean up obstacles
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
      obstacle.geometry.dispose();
      (obstacle.material as THREE.Material).dispose();
    });

    // Clean up decorations
    this.decorations.forEach(decoration => {
      this.scene.remove(decoration);
      decoration.geometry.dispose();
      (decoration.material as THREE.Material).dispose();
    });
  }
}