import Phaser from 'phaser'
import { PLAYER_BODY_SIZE, PLAYER_SPEED, TEXTURE_KEYS } from '../constants/gameConstants'

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface PlayerControls {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  wasdUp: Phaser.Input.Keyboard.Key
  wasdDown: Phaser.Input.Keyboard.Key
  wasdLeft: Phaser.Input.Keyboard.Key
  wasdRight: Phaser.Input.Keyboard.Key
}

// Wraps the player physics sprite so scene code doesn't touch Phaser input/velocity directly.
// When a real sprite sheet arrives, swap the marker for `sprite.anims.play(...)` in setDirection.
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  private readonly marker: Phaser.GameObjects.Image
  private readonly controls: PlayerControls
  private direction: Direction = 'down'
  private controlsEnabled = true

  constructor(scene: Phaser.Scene, x: number, y: number, controls: PlayerControls) {
    this.controls = controls

    this.sprite = scene.physics.add.sprite(x, y, TEXTURE_KEYS.Player)
    this.sprite.setOrigin(0.5, 0.5)
    this.sprite.setCollideWorldBounds(true)

    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setSize(PLAYER_BODY_SIZE, PLAYER_BODY_SIZE)
    body.setOffset(
      (this.sprite.width - PLAYER_BODY_SIZE) / 2,
      (this.sprite.height - PLAYER_BODY_SIZE) / 2,
    )

    this.marker = scene.add.image(x, y, TEXTURE_KEYS.PlayerMarker)
    this.marker.setDepth(this.sprite.depth + 1)
    this.updateMarkerPosition()
  }

  update(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body

    if (!this.controlsEnabled) {
      body.setVelocity(0, 0)
      return
    }

    const up = this.controls.up.isDown || this.controls.wasdUp.isDown
    const down = this.controls.down.isDown || this.controls.wasdDown.isDown
    const left = this.controls.left.isDown || this.controls.wasdLeft.isDown
    const right = this.controls.right.isDown || this.controls.wasdRight.isDown

    const velocity = new Phaser.Math.Vector2(0, 0)
    if (up) velocity.y -= 1
    if (down) velocity.y += 1
    if (left) velocity.x -= 1
    if (right) velocity.x += 1

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(PLAYER_SPEED)
      this.setDirection(this.pickDirection(velocity.x, velocity.y))
    }

    body.setVelocity(velocity.x, velocity.y)
    this.updateMarkerPosition()
  }

  enableControls(): void {
    this.controlsEnabled = true
  }

  disableControls(): void {
    this.controlsEnabled = false
    const body = this.sprite.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
  }

  getCenter(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  destroy(): void {
    this.marker.destroy()
    this.sprite.destroy()
  }

  private setDirection(direction: Direction): void {
    if (direction === this.direction) return
    this.direction = direction
  }

  private pickDirection(vx: number, vy: number): Direction {
    if (Math.abs(vx) > Math.abs(vy)) {
      return vx < 0 ? 'left' : 'right'
    }
    return vy < 0 ? 'up' : 'down'
  }

  private updateMarkerPosition(): void {
    const offset = 10
    switch (this.direction) {
      case 'up':
        this.marker.setPosition(this.sprite.x, this.sprite.y - offset)
        this.marker.setRotation(0)
        break
      case 'down':
        this.marker.setPosition(this.sprite.x, this.sprite.y + offset)
        this.marker.setRotation(0)
        break
      case 'left':
        this.marker.setPosition(this.sprite.x - offset, this.sprite.y)
        this.marker.setRotation(Math.PI / 2)
        break
      case 'right':
        this.marker.setPosition(this.sprite.x + offset, this.sprite.y)
        this.marker.setRotation(Math.PI / 2)
        break
    }
  }
}
