export class UI {
  private score: number = 0;
  private level: number = 1;

  updateScore(points: number) {
    this.score += points;
    this.updateDisplay();
  }

  setLevel(level: number) {
    this.level = level;
    this.updateDisplay();
  }

  private updateDisplay() {
    // Update UI elements through React state
    // This will be handled by the Game component
  }

  showGameOver() {
    // Show game over screen through React state
  }

  showLevelComplete() {
    // Show level complete screen through React state
  }
}
