import Phaser from 'phaser'

// Idle boot scene — sits and waits for BattleScene to be explicitly started
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    // Nothing — PhaserGame.tsx will call game.scene.start('BattleScene', data)
  }
}
