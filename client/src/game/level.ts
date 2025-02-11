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
  private mapSize = 2000; // Vast desert area
  private terrainResolution = 1000;
  private terrain!: THREE.Mesh;
  private towers: THREE.Group[] = [];
  private stars: THREE.Points[] = [];

  constructor(scene: THREE.Scene, levelNumber: number) {
    this.scene = scene;
    this.levelNumber = levelNumber;
  }

  load() {
    // Create starfield in the background
    this.createStars();

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
      positions[i + 1] = terrainData[z][x].elevation * 8;
    }
    groundGeometry.computeVertexNormals();

    // Create material for desert terrain
    const groundMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Apply vertex colors
    const colors = new Float32Array(positions.length);
    const normal = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 1];
      normal.set(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      ).normalize();
      const slope = 1 - normal.dot(new THREE.Vector3(0, 1, 0));

      // Desert color palette
      let color = new THREE.Color();
      if (height > 6) {
        // Rocky mountains
        color.setRGB(0.55, 0.5, 0.45);
      } else if (slope > 0.5) {
        // Steep rocky slopes
        color.setRGB(0.6, 0.55, 0.5);
      } else if (height > 2) {
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

    // Add military installations
    this.addTowers(terrainData);
  }

  private createStars() {
    // Create multiple layers of stars for depth
    const createStarLayer = (count: number, size: number, distance: number) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);

        vertices.push(x, y, z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const material = new THREE.PointsMaterial({
        size,
        color: 0xffffff,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.5,
        sizeAttenuation: false
      });

      const stars = new THREE.Points(geometry, material);
      this.scene.add(stars);
      this.stars.push(stars);
    };

    // Create multiple star layers
    createStarLayer(1000, 1.5, 800); // Bright, close stars
    createStarLayer(2000, 1, 900);   // Medium stars
    createStarLayer(3000, 0.5, 1000); // Distant stars
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
        elevation += noise2D(nx * 3, nz * 3) * 0.5;      // Medium dunes
        elevation += noise2D(nx * 6, nz * 6) * 0.25;     // Small ripples
        elevation += noise2D(nx * 12, nz * 12) * 0.125;  // Micro details

        // Create mountain ranges
        const ridgeNoise = Math.abs(noise2D(nx * 2, nz * 2));
        elevation += Math.pow(ridgeNoise, 3) * 4; // More pronounced mountains

        // Create vast desert plains and valleys
        const distance = Math.sqrt(nx * nx + nz * nz) * 2;
        const plainNoise = noise2D(nx * 0.5, nz * 0.5) * 0.5;
        elevation += plainNoise;
        elevation -= Math.exp(-distance * distance) * 0.3;

        // Determine terrain type
        let type: 'sand' | 'rock' | 'mountain';
        if (elevation > 2) {
          type = 'mountain';
        } else if (elevation > 1 || Math.abs(ridgeNoise) > 0.7) {
          type = 'rock';
        } else {
          type = 'sand';
        }

        terrain[z][x] = { elevation, type };
      }
    }

    return terrain;
  }

  private addTowers(terrainData: TerrainPoint[][]) {
    // Add military/industrial towers across the landscape
    for (let i = 0; i < 8; i++) {
      const tower = new THREE.Group();

      const baseGeometry = new THREE.BoxGeometry(4, 2, 4);
      const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        emissive: 0x222222,
        emissiveIntensity: 0.2
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);

      const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20);
      const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        emissive: 0x222222,
        emissiveIntensity: 0.2
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 11;

      // Add a small blinking light at the top
      const lightGeometry = new THREE.SphereGeometry(0.3);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1
      });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.y = 22;

      tower.add(base);
      tower.add(pole);
      tower.add(light);

      // Position towers in a wider circle
      const angle = (Math.PI * 2 * i) / 8;
      const radius = this.mapSize / 3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const terrainX = Math.floor((x + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const terrainZ = Math.floor((z + this.mapSize / 2) / this.mapSize * this.terrainResolution);
      const elevation = terrainData[terrainZ][terrainX].elevation * 8;

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

    this.stars.forEach(stars => {
      this.scene.remove(stars);
      stars.geometry.dispose();
      (stars.material as THREE.Material).dispose();
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