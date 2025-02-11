import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface TerrainPoint {
  elevation: number;
  type: 'sand' | 'rock' | 'mountain';
}

export class Level {
  private scene: THREE.Scene;
  private levelNumber: number;
  private obstacles: THREE.Mesh[] = [];
  private mapSize = 400; // Large desert area
  private terrainResolution = 400;
  private terrain!: THREE.Mesh;
  private decorations: THREE.Mesh[] = [];
  private towers: THREE.Group[] = [];

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
      positions[i + 1] = terrainData[z][x].elevation * 4; // More dramatic dunes
    }
    groundGeometry.computeVertexNormals();

    // Create custom shader material for desert terrain
    const groundMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Apply vertex colors based on height and slope
    const colors = new Float32Array(positions.length);
    const normal = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 1];
      const x = Math.floor((i / 3) % this.terrainResolution);
      const z = Math.floor((i / 3) / this.terrainResolution);

      normal.set(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      ).normalize();
      const slope = 1 - normal.dot(new THREE.Vector3(0, 1, 0));

      // Desert color palette
      let color = new THREE.Color();
      if (height > 3) {
        // Rocky mountains
        color.setRGB(0.55, 0.5, 0.45);
      } else if (slope > 0.5) {
        // Steep rocky slopes
        color.setRGB(0.6, 0.55, 0.5);
      } else if (height > 1) {
        // Light sand dunes
        color.setRGB(0.95, 0.9, 0.7);
      } else {
        // Dark sand valleys
        color.setRGB(0.85, 0.8, 0.6);
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
    this.addTowers(terrainData);
  }

  private generateTerrainData(): TerrainPoint[][] {
    const terrain: TerrainPoint[][] = [];
    const noise2D = createNoise2D();

    for (let z = 0; z < this.terrainResolution; z++) {
      terrain[z] = [];
      for (let x = 0; x < this.terrainResolution; x++) {
        const nx = x / this.terrainResolution - 0.5;
        const nz = z / this.terrainResolution - 0.5;

        // Generate sand dunes using multiple noise layers
        let elevation = 0;
        elevation += noise2D(nx * 1.5, nz * 1.5) * 1.0;  // Large dunes
        elevation += noise2D(nx * 3, nz * 3) * 0.5;     // Medium dunes
        elevation += noise2D(nx * 6, nz * 6) * 0.25;    // Small ripples

        // Create some mountain ranges
        const ridgeNoise = Math.abs(noise2D(nx * 2, nz * 2));
        elevation += Math.pow(ridgeNoise, 2) * 2;

        // Make the terrain more interesting with valleys
        const distance = Math.sqrt(nx * nx + nz * nz) * 2;
        elevation -= Math.exp(-distance * distance) * 0.3;

        // Determine terrain type
        let type: 'sand' | 'rock' | 'mountain';
        if (elevation > 2) {
          type = 'mountain';
        } else if (elevation > 1) {
          type = 'rock';
        } else {
          type = 'sand';
        }

        terrain[z][x] = { elevation, type };
      }
    }

    return terrain;
  }

  private addDecorations(terrainData: TerrainPoint[][]) {
    // Add rocks with desert weathering
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B7355,  // Desert rock color
      roughness: 1.0,
      metalness: 0.1,
    });

    for (let i = 0; i < 300; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      const x = Math.random() * this.mapSize - this.mapSize / 2;
      const z = Math.random() * this.mapSize - this.mapSize / 2;

      const terrainX = Math.floor((x + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const terrainZ = Math.floor((z + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const elevation = terrainData[terrainZ][terrainX].elevation * 4;

      if (elevation > 1) {
        rock.position.set(x, elevation + 0.5, z);
        rock.scale.set(
          0.5 + Math.random() * 2,
          0.5 + Math.random() * 2,
          0.5 + Math.random() * 2
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
  }

  private addTowers(terrainData: TerrainPoint[][]) {
    // Add communication towers like in the reference image
    for (let i = 0; i < 4; i++) {
      const tower = new THREE.Group();

      // Tower base
      const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
      const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);

      // Tower structure
      const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 7.5;

      tower.add(base);
      tower.add(pole);

      // Position tower
      const angle = (Math.PI * 2 * i) / 4;
      const radius = this.mapSize / 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const terrainX = Math.floor((x + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const terrainZ = Math.floor((z + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const elevation = terrainData[terrainZ][terrainX].elevation * 4;

      tower.position.set(x, elevation, z);
      this.towers.push(tower);
      this.scene.add(tower);
    }
  }

  getEnemyCount() {
    return Math.min(2 + this.levelNumber, 5);
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

    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
      obstacle.geometry.dispose();
      (obstacle.material as THREE.Material).dispose();
    });

    this.decorations.forEach(decoration => {
      this.scene.remove(decoration);
      decoration.geometry.dispose();
      (decoration.material as THREE.Material).dispose();
    });

    this.towers.forEach(tower => {
      this.scene.remove(tower);
      tower.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });
  }
}