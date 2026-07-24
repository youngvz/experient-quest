import Phaser from 'phaser'
import { buildGameConfig } from './config/gameConfig'

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game(buildGameConfig(parent))
}
