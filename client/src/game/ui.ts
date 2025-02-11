export class UI {
  private score: number = 0;
  private level: number = 1;
  private health: number = 100;
  private gameOverCallback?: () => void;
  private levelCompleteCallback?: () => void;

  updateScore(points: number) {
    this.score += points;
    this.updateDisplay();
  }

  setLevel(level: number) {
    this.level = level;
    this.updateDisplay();
  }

  updateHealth(health: number) {
    this.health = health;
    this.updateDisplay();
  }

  getScore() {
    return this.score;
  }

  getLevel() {
    return this.level;
  }

  getHealth() {
    return this.health;
  }

  setGameOverCallback(callback: () => void) {
    this.gameOverCallback = callback;
  }

  setLevelCompleteCallback(callback: () => void) {
    this.levelCompleteCallback = callback;
  }

  showGameOver() {
    if (this.gameOverCallback) {
      this.gameOverCallback();
    }
  }

  showLevelComplete() {
    if (this.levelCompleteCallback) {
      this.levelCompleteCallback();
    }
  }

  private updateDisplay() {
    // This function will be called by the React component
    // to update the UI state
  }
}