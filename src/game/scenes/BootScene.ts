import Phaser from 'phaser'
import { COLORS, SCENE_KEYS, TEXTURE_KEYS, TILE_SIZE } from '../constants/gameConstants'

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot)
  }

  preload(): void {
    // No binary assets required — everything is generated in `create`.
  }

  create(): void {
    this.generateFloorTexture(TEXTURE_KEYS.Floor, COLORS.floor, COLORS.floorAlt)
    this.generateSolidTexture(TEXTURE_KEYS.Wall, TILE_SIZE, TILE_SIZE, COLORS.wall)
    this.generateDeskTexture()
    this.generateTvTexture()
    this.generatePlayerTexture()
    this.generatePlayerMarkerTexture()

    this.scene.start(SCENE_KEYS.Office)
  }

  private generateFloorTexture(key: string, base: number, accent: number): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(base, 1)
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    graphics.lineStyle(1, accent, 1)
    graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)
    graphics.generateTexture(key, TILE_SIZE, TILE_SIZE)
    graphics.destroy()
  }

  private generateSolidTexture(key: string, width: number, height: number, color: number): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(color, 1)
    graphics.fillRect(0, 0, width, height)
    graphics.generateTexture(key, width, height)
    graphics.destroy()
  }

  private generateDeskTexture(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.desk, 1)
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    graphics.fillStyle(COLORS.deskTop, 1)
    graphics.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4)
    graphics.generateTexture(TEXTURE_KEYS.Desk, TILE_SIZE, TILE_SIZE)
    graphics.destroy()
  }

  private generateTvTexture(): void {
    const width = TILE_SIZE * 2
    const height = TILE_SIZE
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.tvBezel, 1)
    graphics.fillRect(0, 0, width, height)
    graphics.fillStyle(COLORS.tvScreen, 1)
    graphics.fillRect(4, 4, width - 8, height - 8)
    graphics.generateTexture(TEXTURE_KEYS.Tv, width, height)
    graphics.destroy()
  }

  private generatePlayerTexture(): void {
    const size = 24
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.player, 1)
    graphics.fillRoundedRect(0, 0, size, size, 4)
    graphics.generateTexture(TEXTURE_KEYS.Player, size, size)
    graphics.destroy()
  }

  private generatePlayerMarkerTexture(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.playerMarker, 1)
    graphics.fillRect(0, 0, 6, 4)
    graphics.generateTexture(TEXTURE_KEYS.PlayerMarker, 6, 4)
    graphics.destroy()
  }
}
