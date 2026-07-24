import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { OfficeScene } from '../scenes/OfficeScene'
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants/gameConstants'

export function buildGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: `#${COLORS.background.toString(16).padStart(6, '0')}`,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, OfficeScene],
  }
}
