import Phaser from 'phaser'
import { Player, type PlayerControls } from '../entities/Player'
import { gameEvents } from '../events/GameEventBus'
import {
  COLORS,
  INTERACTION_ZONE_PADDING,
  MAP_HEIGHT_PX,
  MAP_HEIGHT_TILES,
  MAP_WIDTH_PX,
  MAP_WIDTH_TILES,
  SCENE_KEYS,
  TEXTURE_KEYS,
  TILE_SIZE,
} from '../constants/gameConstants'
import { InteractionManager } from '../interactions/InteractionManager'
import { officeInteractions } from '../interactions/interactionTypes'

interface DeskLayout {
  tileX: number
  tileY: number
  widthTiles: number
  heightTiles: number
}

interface TvLayout {
  tileX: number
  tileY: number
}

// Programmatic placeholder room. When Tiled arrives, replace `createPlaceholderOffice`
// with a loader that consumes tile/object layers — no other scene logic should need to change.
export class OfficeScene extends Phaser.Scene {
  private player!: Player
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private interactionZones!: Phaser.GameObjects.Group
  private interactionManager!: InteractionManager
  private interactKey!: Phaser.Input.Keyboard.Key
  private unsubscribers: Array<() => void> = []

  constructor() {
    super(SCENE_KEYS.Office)
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background)
    this.physics.world.setBounds(0, 0, MAP_WIDTH_PX, MAP_HEIGHT_PX)

    const desk: DeskLayout = { tileX: 4, tileY: 4, widthTiles: 4, heightTiles: 2 }
    const tv: TvLayout = { tileX: 8, tileY: 2 }
    const spawnTile = { x: 10, y: 8 }

    this.createFloor()
    this.solids = this.physics.add.staticGroup()
    this.createWalls()
    this.createDesk(desk)
    this.createTv(tv)

    const controls = this.createControls()
    this.player = new Player(
      this,
      spawnTile.x * TILE_SIZE + TILE_SIZE / 2,
      spawnTile.y * TILE_SIZE + TILE_SIZE / 2,
      controls,
    )

    this.physics.add.collider(this.player.sprite, this.solids)

    this.interactionZones = this.add.group()
    this.interactionManager = new InteractionManager({
      onAvailable: (definition) => {
        gameEvents.emit('interaction:available', {
          id: definition.id,
          prompt: definition.prompt,
        })
      },
      onUnavailable: () => {
        gameEvents.emit('interaction:unavailable', undefined)
      },
      onTriggered: (definition) => {
        this.player.disableControls()
        this.interactionManager.disable()
        gameEvents.emit('interaction:triggered', {
          id: definition.id,
          title: definition.contentTitle,
          body: definition.contentBody,
        })
      },
    })

    this.registerTvInteractionZone(tv)

    this.cameras.main.setBounds(0, 0, MAP_WIDTH_PX, MAP_HEIGHT_PX)
    this.cameras.main.startFollow(this.player.sprite, true)
    this.cameras.main.setRoundPixels(true)

    const unsubscribeOverlayClosed = gameEvents.on('overlay:closed', () => {
      this.interactionManager.enable()
      this.player.enableControls()
    })
    this.unsubscribers.push(unsubscribeOverlayClosed)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup())
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup())
  }

  update(): void {
    this.player.update()
    this.interactionManager.update(this.player.getCenter())
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.interactionManager.trigger()
    }
  }

  private cleanup(): void {
    this.unsubscribers.forEach((off) => off())
    this.unsubscribers = []
  }

  private createFloor(): void {
    for (let ty = 0; ty < MAP_HEIGHT_TILES; ty++) {
      for (let tx = 0; tx < MAP_WIDTH_TILES; tx++) {
        this.add
          .image(tx * TILE_SIZE, ty * TILE_SIZE, TEXTURE_KEYS.Floor)
          .setOrigin(0, 0)
          .setDepth(-10)
      }
    }
  }

  private createWalls(): void {
    for (let tx = 0; tx < MAP_WIDTH_TILES; tx++) {
      this.addSolid(tx, 0, TEXTURE_KEYS.Wall)
      this.addSolid(tx, MAP_HEIGHT_TILES - 1, TEXTURE_KEYS.Wall)
    }
    for (let ty = 1; ty < MAP_HEIGHT_TILES - 1; ty++) {
      this.addSolid(0, ty, TEXTURE_KEYS.Wall)
      this.addSolid(MAP_WIDTH_TILES - 1, ty, TEXTURE_KEYS.Wall)
    }
  }

  private createDesk(desk: DeskLayout): void {
    for (let dy = 0; dy < desk.heightTiles; dy++) {
      for (let dx = 0; dx < desk.widthTiles; dx++) {
        this.addSolid(desk.tileX + dx, desk.tileY + dy, TEXTURE_KEYS.Desk)
      }
    }
  }

  private createTv(tv: TvLayout): void {
    const px = tv.tileX * TILE_SIZE
    const py = tv.tileY * TILE_SIZE
    const image = this.add.image(px, py, TEXTURE_KEYS.Tv).setOrigin(0, 0)
    this.physics.add.existing(image, true)
    this.solids.add(image)
  }

  private addSolid(tileX: number, tileY: number, textureKey: string): void {
    const image = this.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE, textureKey).setOrigin(0, 0)
    this.solids.add(image)
  }

  private createControls(): PlayerControls {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input plugin unavailable')
    }
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes
    const keyboard = this.input.keyboard
    return {
      up: keyboard.addKey(KeyCodes.UP),
      down: keyboard.addKey(KeyCodes.DOWN),
      left: keyboard.addKey(KeyCodes.LEFT),
      right: keyboard.addKey(KeyCodes.RIGHT),
      wasdUp: keyboard.addKey(KeyCodes.W),
      wasdDown: keyboard.addKey(KeyCodes.S),
      wasdLeft: keyboard.addKey(KeyCodes.A),
      wasdRight: keyboard.addKey(KeyCodes.D),
    } satisfies PlayerControls
  }

  private registerTvInteractionZone(tv: TvLayout): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input plugin unavailable')
    }
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    const zoneWidth = TILE_SIZE * 2 + INTERACTION_ZONE_PADDING * 2
    const zoneHeight = TILE_SIZE * 2 + INTERACTION_ZONE_PADDING
    const zoneX = tv.tileX * TILE_SIZE - INTERACTION_ZONE_PADDING
    const zoneY = tv.tileY * TILE_SIZE + TILE_SIZE

    const zone = this.add.zone(zoneX, zoneY, zoneWidth, zoneHeight).setOrigin(0, 0)
    this.physics.add.existing(zone, true)
    this.interactionZones.add(zone)

    this.interactionManager.registerZone(
      'events-tv',
      { x: zoneX, y: zoneY, width: zoneWidth, height: zoneHeight },
      officeInteractions['events-tv'],
    )
  }
}
