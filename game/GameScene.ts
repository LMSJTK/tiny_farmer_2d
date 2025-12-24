import Phaser from 'phaser';
import { GameState, CropType, Plot, BuildingPlotState } from '../types';
import { CROPS, BUILDINGS, TICK_RATE_MS, PLOTS_PER_FIELD_AREA } from '../constants';

// Tile constants
const TILE_SIZE = 64;
const GRID_WIDTH = 5;
const GRID_HEIGHT = 5;
const WORLD_PADDING = 128;

// Colors for different plot states
const COLORS = {
  ground: 0x8B7355,
  groundUnlocked: 0x654321,
  grass: 0x228B22,
  path: 0xC4A574,
  player: 0x4169E1,
  highlight: 0xFFFF00,
};

// Crop colors based on type
const CROP_COLORS: Record<CropType, number> = {
  [CropType.WHEAT]: 0xF4D03F,
  [CropType.CORN]: 0xF7DC6F,
  [CropType.CARROT]: 0xE67E22,
  [CropType.TOMATO]: 0xE74C3C,
  [CropType.PUMPKIN]: 0xD35400,
  [CropType.STRAWBERRY]: 0xE91E63,
};

export interface GameSceneCallbacks {
  onInteract: (plotId: string) => void;
  onUnlockPlot: (plotId: string) => void;
  getGameState: () => GameState;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private plotSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private callbacks: GameSceneCallbacks | null = null;
  private highlightTile!: Phaser.GameObjects.Rectangle;
  private interactionText!: Phaser.GameObjects.Text;
  private lastGameState: GameState | null = null;
  private playerGridX = 2;
  private playerGridY = 2;
  private isMoving = false;
  private moveSpeed = 200;
  private accumulatedTime = 0;
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  private worldContainer!: Phaser.GameObjects.Container;
  private currentArea = 1;
  private areaLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  setCallbacks(callbacks: GameSceneCallbacks) {
    this.callbacks = callbacks;
  }

  setCurrentArea(area: number) {
    this.currentArea = area;
    this.updateWorld();
  }

  create() {
    // Create world container for easy camera following
    this.worldContainer = this.add.container(0, 0);

    // Create the world
    this.createWorld();

    // Create player
    this.createPlayer();

    // Create highlight tile
    this.highlightTile = this.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4);
    this.highlightTile.setStrokeStyle(3, COLORS.highlight);
    this.highlightTile.setFillStyle(COLORS.highlight, 0.2);
    this.highlightTile.setDepth(50);

    // Create interaction prompt text
    this.interactionText = this.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    });
    this.interactionText.setOrigin(0.5);
    this.interactionText.setDepth(100);

    // Area label
    this.areaLabel = this.add.text(16, 16, 'Field Area 1', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#228B22dd',
      padding: { x: 12, y: 6 },
    });
    this.areaLabel.setScrollFactor(0);
    this.areaLabel.setDepth(200);

    // Setup input
    this.setupInput();

    // Setup camera
    this.cameras.main.setBackgroundColor('#87CEEB');
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Initial world update
    this.updateWorld();
  }

  private createWorld() {
    const worldWidth = GRID_WIDTH * TILE_SIZE + WORLD_PADDING * 2;
    const worldHeight = GRID_HEIGHT * TILE_SIZE + WORLD_PADDING * 2;

    // Create grass background
    const grass = this.add.rectangle(
      worldWidth / 2,
      worldHeight / 2,
      worldWidth * 2,
      worldHeight * 2,
      COLORS.grass
    );
    grass.setDepth(-10);
    this.worldContainer.add(grass);

    // Create decorative path around the farm
    const pathWidth = GRID_WIDTH * TILE_SIZE + 32;
    const pathHeight = GRID_HEIGHT * TILE_SIZE + 32;
    const path = this.add.rectangle(
      WORLD_PADDING + (GRID_WIDTH * TILE_SIZE) / 2,
      WORLD_PADDING + (GRID_HEIGHT * TILE_SIZE) / 2,
      pathWidth,
      pathHeight,
      COLORS.path
    );
    path.setDepth(-5);
    this.worldContainer.add(path);

    // Create plot tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const plotIndex = y * GRID_WIDTH + x;
        const plotId = this.getPlotIdForCurrentArea(plotIndex);

        const worldX = WORLD_PADDING + x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = WORLD_PADDING + y * TILE_SIZE + TILE_SIZE / 2;

        const container = this.createPlotContainer(plotId, worldX, worldY);
        this.plotSprites.set(plotId, container);
        this.worldContainer.add(container);
      }
    }
  }

  private getPlotIdForCurrentArea(index: number): string {
    if (this.currentArea === 1) {
      return `plot-${index}`;
    }
    return `plot-${this.currentArea}-${index}`;
  }

  private createPlotContainer(plotId: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setData('plotId', plotId);

    // Ground tile
    const ground = this.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, COLORS.ground);
    ground.setStrokeStyle(2, 0x000000, 0.3);
    container.add(ground);
    container.setData('ground', ground);

    // Crop sprite (hidden initially)
    const cropBg = this.add.circle(0, -8, 20, 0x000000, 0);
    container.add(cropBg);
    container.setData('cropBg', cropBg);

    // Crop emoji text
    const cropText = this.add.text(0, -8, '', {
      fontSize: '28px',
    });
    cropText.setOrigin(0.5);
    container.add(cropText);
    container.setData('cropText', cropText);

    // Progress bar background
    const progressBg = this.add.rectangle(0, 20, TILE_SIZE - 16, 6, 0x000000, 0.3);
    container.add(progressBg);
    container.setData('progressBg', progressBg);

    // Progress bar
    const progressBar = this.add.rectangle(0, 20, 0, 4, 0x00FF00);
    progressBar.setOrigin(0.5, 0.5);
    container.add(progressBar);
    container.setData('progressBar', progressBar);

    // Ready indicator
    const readyText = this.add.text(0, -28, '✓', {
      fontSize: '20px',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 3,
    });
    readyText.setOrigin(0.5);
    readyText.setVisible(false);
    container.add(readyText);
    container.setData('readyText', readyText);

    // Lock icon for locked plots
    const lockText = this.add.text(0, 0, '🔒', {
      fontSize: '24px',
    });
    lockText.setOrigin(0.5);
    lockText.setVisible(false);
    container.add(lockText);
    container.setData('lockText', lockText);

    // Manager indicator
    const managerBadge = this.add.text(TILE_SIZE / 2 - 8, -TILE_SIZE / 2 + 8, '👨‍🌾', {
      fontSize: '14px',
    });
    managerBadge.setOrigin(0.5);
    managerBadge.setVisible(false);
    container.add(managerBadge);
    container.setData('managerBadge', managerBadge);

    container.setDepth(10);
    return container;
  }

  private createPlayer() {
    const startX = WORLD_PADDING + this.playerGridX * TILE_SIZE + TILE_SIZE / 2;
    const startY = WORLD_PADDING + this.playerGridY * TILE_SIZE + TILE_SIZE / 2;

    this.player = this.add.container(startX, startY);

    // Player body
    const body = this.add.circle(0, 4, 16, COLORS.player);
    body.setStrokeStyle(3, 0x000000);
    this.player.add(body);

    // Player head
    const head = this.add.circle(0, -12, 12, 0xFFDBB4);
    head.setStrokeStyle(2, 0x000000);
    this.player.add(head);

    // Player hat
    const hat = this.add.ellipse(0, -22, 30, 10, 0x8B4513);
    this.player.add(hat);
    const hatTop = this.add.rectangle(0, -28, 20, 12, 0x8B4513);
    hatTop.setOrigin(0.5, 1);
    this.player.add(hatTop);

    // Shadow
    const shadow = this.add.ellipse(0, 24, 32, 12, 0x000000, 0.3);
    shadow.setDepth(-1);
    this.player.add(shadow);

    this.player.setDepth(60);
  }

  private setupInput() {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Handle E key for interaction
    this.interactKey.on('down', () => this.handleInteraction());

    // Also handle Space for interaction
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => this.handleInteraction());
  }

  private handleInteraction() {
    if (!this.callbacks) return;

    const gameState = this.callbacks.getGameState();
    const plotIndex = this.playerGridY * GRID_WIDTH + this.playerGridX;

    // Calculate plot ID based on current area
    const plots = this.getPlotsForCurrentArea(gameState);
    if (plotIndex < 0 || plotIndex >= plots.length) return;

    const plot = plots[plotIndex];
    if (!plot) return;

    if (!plot.isUnlocked) {
      // Try to unlock
      this.callbacks.onUnlockPlot(plot.id);
      this.showFloatingText(this.player.x, this.player.y - 40, 'Unlocking...', '#FFD700');
    } else {
      // Interact (plant or harvest)
      this.callbacks.onInteract(plot.id);
      if (plot.crop?.isReady) {
        this.showFloatingText(this.player.x, this.player.y - 40, 'Harvested!', '#00FF00');
      } else if (!plot.crop) {
        const cropEmoji = CROPS[gameState.selectedSeed].emoji;
        this.showFloatingText(this.player.x, this.player.y - 40, `Planted ${cropEmoji}`, '#90EE90');
      }
    }
  }

  private getPlotsForCurrentArea(gameState: GameState): Plot[] {
    const startIndex = (this.currentArea - 1) * PLOTS_PER_FIELD_AREA;
    return gameState.plots.slice(startIndex, startIndex + PLOTS_PER_FIELD_AREA);
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const floatText = this.add.text(x, y, text, {
      fontSize: '16px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    floatText.setOrigin(0.5);
    floatText.setDepth(150);
    this.floatingTexts.push(floatText);

    this.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatText.destroy();
        const index = this.floatingTexts.indexOf(floatText);
        if (index > -1) this.floatingTexts.splice(index, 1);
      }
    });
  }

  update(time: number, delta: number) {
    this.handleMovement(delta);
    this.updateHighlight();
    this.updateInteractionPrompt();

    // Update world visuals periodically
    this.accumulatedTime += delta;
    if (this.accumulatedTime >= TICK_RATE_MS) {
      this.accumulatedTime = 0;
      this.updateWorld();
    }
  }

  private handleMovement(delta: number) {
    if (this.isMoving) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) dx = -1;
    else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dx = 1;
    else if (this.cursors.up.isDown || this.wasdKeys.W.isDown) dy = -1;
    else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) dy = 1;

    if (dx !== 0 || dy !== 0) {
      const newGridX = this.playerGridX + dx;
      const newGridY = this.playerGridY + dy;

      // Check bounds
      if (newGridX >= 0 && newGridX < GRID_WIDTH && newGridY >= 0 && newGridY < GRID_HEIGHT) {
        this.isMoving = true;
        this.playerGridX = newGridX;
        this.playerGridY = newGridY;

        const targetX = WORLD_PADDING + newGridX * TILE_SIZE + TILE_SIZE / 2;
        const targetY = WORLD_PADDING + newGridY * TILE_SIZE + TILE_SIZE / 2;

        this.tweens.add({
          targets: this.player,
          x: targetX,
          y: targetY,
          duration: 150,
          ease: 'Power1',
          onComplete: () => {
            this.isMoving = false;
          }
        });
      }
    }
  }

  private updateHighlight() {
    const highlightX = WORLD_PADDING + this.playerGridX * TILE_SIZE + TILE_SIZE / 2;
    const highlightY = WORLD_PADDING + this.playerGridY * TILE_SIZE + TILE_SIZE / 2;
    this.highlightTile.setPosition(highlightX, highlightY);
  }

  private updateInteractionPrompt() {
    if (!this.callbacks) {
      this.interactionText.setVisible(false);
      return;
    }

    const gameState = this.callbacks.getGameState();
    const plots = this.getPlotsForCurrentArea(gameState);
    const plotIndex = this.playerGridY * GRID_WIDTH + this.playerGridX;
    const plot = plots[plotIndex];

    if (!plot) {
      this.interactionText.setVisible(false);
      return;
    }

    let promptText = '';
    if (!plot.isUnlocked) {
      promptText = '[E] Unlock Plot';
    } else if (plot.crop?.isReady) {
      promptText = '[E] Harvest';
    } else if (!plot.crop) {
      const cropName = CROPS[gameState.selectedSeed].name;
      promptText = `[E] Plant ${cropName}`;
    } else {
      const progress = Math.floor(plot.crop.progress);
      promptText = `Growing... ${progress}%`;
    }

    this.interactionText.setText(promptText);
    this.interactionText.setPosition(this.player.x, this.player.y - 60);
    this.interactionText.setVisible(true);
  }

  updateWorld() {
    if (!this.callbacks) return;

    const gameState = this.callbacks.getGameState();
    this.lastGameState = gameState;

    // Update area label
    this.areaLabel.setText(`Field Area ${this.currentArea}`);

    // Update plots
    const plots = this.getPlotsForCurrentArea(gameState);

    // Clear old plot sprites if area changed
    const existingPlotIds = Array.from(this.plotSprites.keys());
    const currentPlotIds = plots.map(p => p.id);

    for (const oldId of existingPlotIds) {
      if (!currentPlotIds.includes(oldId)) {
        const container = this.plotSprites.get(oldId);
        if (container) container.destroy();
        this.plotSprites.delete(oldId);
      }
    }

    // Update or create plot containers
    plots.forEach((plot, index) => {
      const x = index % GRID_WIDTH;
      const y = Math.floor(index / GRID_WIDTH);
      const worldX = WORLD_PADDING + x * TILE_SIZE + TILE_SIZE / 2;
      const worldY = WORLD_PADDING + y * TILE_SIZE + TILE_SIZE / 2;

      let container = this.plotSprites.get(plot.id);
      if (!container) {
        container = this.createPlotContainer(plot.id, worldX, worldY);
        this.plotSprites.set(plot.id, container);
        this.worldContainer.add(container);
      }

      this.updatePlotVisuals(container, plot, gameState);
    });
  }

  private updatePlotVisuals(container: Phaser.GameObjects.Container, plot: Plot, gameState: GameState) {
    const ground = container.getData('ground') as Phaser.GameObjects.Rectangle;
    const cropText = container.getData('cropText') as Phaser.GameObjects.Text;
    const cropBg = container.getData('cropBg') as Phaser.GameObjects.Arc;
    const progressBar = container.getData('progressBar') as Phaser.GameObjects.Rectangle;
    const progressBg = container.getData('progressBg') as Phaser.GameObjects.Rectangle;
    const readyText = container.getData('readyText') as Phaser.GameObjects.Text;
    const lockText = container.getData('lockText') as Phaser.GameObjects.Text;
    const managerBadge = container.getData('managerBadge') as Phaser.GameObjects.Text;

    if (!plot.isUnlocked) {
      // Locked plot
      ground.setFillStyle(0x555555);
      cropText.setVisible(false);
      cropBg.setVisible(false);
      progressBar.setVisible(false);
      progressBg.setVisible(false);
      readyText.setVisible(false);
      lockText.setVisible(true);
      managerBadge.setVisible(false);
    } else {
      lockText.setVisible(false);
      ground.setFillStyle(COLORS.groundUnlocked);

      // Show manager badge if has manager
      const hasManager = plot.manager !== null ||
        gameState.plots.some(p => p.manager?.managedPlotIds?.includes(plot.id));
      managerBadge.setVisible(hasManager);

      if (plot.crop) {
        const cropConfig = CROPS[plot.crop.type];
        cropText.setText(cropConfig.emoji);
        cropText.setVisible(true);

        // Crop background
        cropBg.setFillStyle(CROP_COLORS[plot.crop.type], 0.3);
        cropBg.setVisible(true);

        // Progress
        if (plot.crop.isReady) {
          progressBar.setVisible(false);
          progressBg.setVisible(false);
          readyText.setVisible(true);
          // Scale pulse for ready crops
          cropText.setScale(1 + Math.sin(Date.now() / 200) * 0.1);
        } else {
          const progressWidth = (plot.crop.progress / 100) * (TILE_SIZE - 16);
          progressBar.setDisplaySize(progressWidth, 4);
          progressBar.setFillStyle(plot.crop.progress >= 100 ? 0x00FF00 : 0xFFFF00);
          progressBar.setVisible(true);
          progressBg.setVisible(true);
          readyText.setVisible(false);
          cropText.setScale(0.6 + (plot.crop.progress / 100) * 0.4);
        }
      } else {
        // Empty unlocked plot
        cropText.setVisible(false);
        cropBg.setVisible(false);
        progressBar.setVisible(false);
        progressBg.setVisible(false);
        readyText.setVisible(false);
      }
    }
  }

  // Public method to force update when React state changes
  forceUpdate() {
    this.updateWorld();
  }
}
