import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { GameScene, GameSceneCallbacks } from './GameScene';
import { GameState } from '../types';

export interface PhaserGameRef {
  setCurrentArea: (area: number) => void;
  forceUpdate: () => void;
}

interface PhaserGameProps {
  gameState: GameState;
  onInteract: (plotId: string) => void;
  onUnlockPlot: (plotId: string) => void;
  currentFieldArea: number;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  ({ gameState, onInteract, onUnlockPlot, currentFieldArea }, ref) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<GameScene | null>(null);
    const gameStateRef = useRef<GameState>(gameState);

    // Keep gameState ref updated
    useEffect(() => {
      gameStateRef.current = gameState;
    }, [gameState]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      setCurrentArea: (area: number) => {
        if (sceneRef.current) {
          sceneRef.current.setCurrentArea(area);
        }
      },
      forceUpdate: () => {
        if (sceneRef.current) {
          sceneRef.current.forceUpdate();
        }
      },
    }));

    useEffect(() => {
      if (!gameContainerRef.current) return;

      // Create the Phaser game
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: '100%',
        height: '100%',
        backgroundColor: '#87CEEB',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: GameScene,
        input: {
          keyboard: true,
        },
      };

      gameRef.current = new Phaser.Game(config);

      // Wait for scene to be ready, then set callbacks
      gameRef.current.events.once('ready', () => {
        const scene = gameRef.current?.scene.getScene('GameScene') as GameScene;
        if (scene) {
          sceneRef.current = scene;

          const callbacks: GameSceneCallbacks = {
            onInteract,
            onUnlockPlot,
            getGameState: () => gameStateRef.current,
          };

          scene.setCallbacks(callbacks);
        }
      });

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
          sceneRef.current = null;
        }
      };
    }, []);

    // Update scene when area changes
    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.setCurrentArea(currentFieldArea);
      }
    }, [currentFieldArea]);

    // Force update scene when game state changes significantly
    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.forceUpdate();
      }
    }, [gameState.plots, gameState.selectedSeed]);

    return (
      <div
        ref={gameContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    );
  }
);

PhaserGame.displayName = 'PhaserGame';
