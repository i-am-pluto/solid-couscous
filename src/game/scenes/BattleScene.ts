import Phaser from 'phaser'
import { Boss, GearItem, World } from '../../types'
import { eventBus, EVENTS } from '../EventBus'
import { GEAR_ITEMS, getGearById } from '../data/gear'
import { QUESTIONS, getQuestionByGearReward } from '../../lib/questions'

interface Projectile extends Phaser.GameObjects.Ellipse {
  vx: number
  vy: number
  damage: number
}

export class BattleScene extends Phaser.Scene {
  // Core entities
  private playerBody!: Phaser.GameObjects.Container
  private bossBody!: Phaser.GameObjects.Container
  private playerShadow!: Phaser.GameObjects.Ellipse
  private bossShadow!: Phaser.GameObjects.Ellipse

  // Physics
  private playerVelX = 0
  private playerVelY = 0
  private bossVelX = 0
  private bossVelY = 0
  private playerOnGround = true
  private bossOnGround = true
  private groundY = 0
  private gravity = 1800

  // State
  private playerHP = 150
  private playerMaxHP = 150
  private bossHP = 500
  private bossMaxHP = 500
  private bossPhase: 1 | 2 | 3 = 1
  private playerFacingRight = true
  private bossFacingRight = false
  private combo = 0
  private score = 0
  private isPlayerAttacking = false
  private attackCooldown = 0
  private attackCooldownMax = 600
  private dodgeCooldown = 0
  private isInvincible = false
  private invincibleTimer = 0
  private bossAttackTimer = 0
  private bossAttackIndex = 0
  private bossMovement = 'chase'
  private bossCharging = false
  private bossChargeVelX = 0
  private bossPhaseChangeShown = false

  // Visual
  private projectiles: Projectile[] = []
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number; size: number }> = []
  private screenShake = 0
  private flashTimer = 0
  private bgGraphics!: Phaser.GameObjects.Graphics
  private fxGraphics!: Phaser.GameObjects.Graphics
  private platformGraphics!: Phaser.GameObjects.Graphics

  // HUD elements
  private playerHPBar!: Phaser.GameObjects.Graphics
  private bossHPBar!: Phaser.GameObjects.Graphics
  private comboText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private damageTexts: Array<{ obj: Phaser.GameObjects.Text; life: number }> = []
  private bossNameText!: Phaser.GameObjects.Text
  private gearNeededText!: Phaser.GameObjects.Text
  private unlockBtn!: Phaser.GameObjects.Container

  // Input
  private keys!: {
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    w: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
    shift: Phaser.Input.Keyboard.Key
    q: Phaser.Input.Keyboard.Key
  }

  // Data
  private boss!: Boss
  private world!: World
  private equippedGear: GearItem[] = []
  private missingGear: GearItem | null = null
  private paused = false
  private bossDefeated = false
  private frameTime = 0
  private enragedEffect = false

  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data: { boss: Boss; world: World; playerHP: number; playerMaxHP: number; gear: GearItem[] }) {
    this.boss = data.boss
    this.world = data.world
    this.playerHP = data.playerHP
    this.playerMaxHP = data.playerMaxHP
    this.bossHP = data.boss.hp
    this.bossMaxHP = data.boss.hp
    this.equippedGear = data.gear || []
    this.bossPhase = 1
    this.combo = 0
    this.score = 0
    this.projectiles = []
    this.particles = []
    this.isInvincible = false
    this.bossDefeated = false
    this.paused = false
    this.missingGear = null
  }

  create() {
    const { width, height } = this.scale
    this.groundY = height - 120

    this.bgGraphics = this.add.graphics()
    this.platformGraphics = this.add.graphics()
    this.fxGraphics = this.add.graphics()

    this.drawBackground()
    this.drawPlatforms()
    this.createPlayerSprite()
    this.createBossSprite()
    this.createHUD()
    this.setupInput()
    this.setupEventListeners()

    // Entrance animation
    this.cameras.main.fadeIn(500)
    this.showBossEntrance()
  }

  private drawBackground() {
    const { width, height } = this.scale
    const g = this.bgGraphics

    // Sky gradient
    const [c1, c2] = this.world.skyGradient.map(c => parseInt(c.replace('#', ''), 16))
    for (let i = 0; i < height; i++) {
      const t = i / height
      const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff
      const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff
      const r = Math.floor(r1 + (r2 - r1) * t)
      const gr = Math.floor(g1 + (g2 - g1) * t)
      const bl = Math.floor(b1 + (b2 - b1) * t)
      g.fillStyle((r << 16) | (gr << 8) | bl, 1)
      g.fillRect(0, i, width, 1)
    }

    // Background elements based on world theme
    this.drawWorldDecorations(g)
  }

  private drawWorldDecorations(g: Phaser.GameObjects.Graphics) {
    const { width, height } = this.scale
    const accent = parseInt(this.world.accentColor.replace('#', ''), 16)

    if (this.world.theme === 'forest') {
      // Trees
      for (let i = 0; i < 8; i++) {
        const x = (i / 7) * width
        const h = 80 + Math.sin(i * 1.5) * 40
        g.fillStyle(0x1a4d1a, 0.6)
        g.fillTriangle(x - 30, height - 120, x + 30, height - 120, x, height - 120 - h)
        g.fillStyle(0x0d2b0d, 0.4)
        g.fillRect(x - 6, height - 120 - 20, 12, 25)
      }
      // Floating particles
      for (let i = 0; i < 15; i++) {
        const px = Math.random() * width
        const py = Math.random() * (height - 180)
        g.fillStyle(accent, 0.3)
        g.fillCircle(px, py, 2 + Math.random() * 3)
      }
    } else if (this.world.theme === 'desert') {
      // Dunes
      for (let i = 0; i < 5; i++) {
        const x = (i / 4) * width
        g.fillStyle(0x8B6914, 0.4)
        g.fillEllipse(x, height - 100, 200 + i * 30, 60)
      }
      // Sun
      g.fillStyle(0xFFAA00, 0.8)
      g.fillCircle(width * 0.85, 80, 45)
      g.fillStyle(0xFFDD00, 0.4)
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2
        g.fillRect(width * 0.85 + Math.cos(angle) * 50, 80 + Math.sin(angle) * 50, 4, 20)
      }
    } else if (this.world.theme === 'ice') {
      // Ice crystals
      for (let i = 0; i < 10; i++) {
        const x = (i / 9) * width
        g.fillStyle(0x87CEEB, 0.3)
        g.fillTriangle(x, height - 120, x - 15, height - 60, x + 15, height - 60)
      }
      // Snow particles
      for (let i = 0; i < 30; i++) {
        const px = Math.random() * width
        const py = Math.random() * (height - 120)
        g.fillStyle(0xFFFFFF, 0.4)
        g.fillCircle(px, py, 1 + Math.random() * 2)
      }
    } else if (this.world.theme === 'lava') {
      // Lava pools
      for (let i = 0; i < 4; i++) {
        const x = (i / 3) * width
        g.fillStyle(0xFF4500, 0.5)
        g.fillEllipse(x, height - 105, 120, 20)
      }
      // Fire particles
      for (let i = 0; i < 20; i++) {
        const px = Math.random() * width
        const py = height - 120 - Math.random() * 60
        g.fillStyle(accent, 0.6)
        g.fillCircle(px, py, 2 + Math.random() * 4)
      }
    } else if (this.world.theme === 'sky') {
      // Clouds
      for (let i = 0; i < 6; i++) {
        const cx = (i / 5) * width
        const cy = 60 + Math.sin(i) * 40
        g.fillStyle(0x7e57c2, 0.3)
        g.fillEllipse(cx, cy, 120, 40)
        g.fillEllipse(cx - 30, cy - 15, 80, 35)
        g.fillEllipse(cx + 30, cy - 10, 70, 30)
      }
    } else if (this.world.theme === 'cyber') {
      // Grid lines
      g.lineStyle(1, accent, 0.15)
      for (let x = 0; x < width; x += 40) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x, height)
        g.strokePath()
      }
      for (let y = 0; y < height; y += 40) {
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(width, y)
        g.strokePath()
      }
      // Neon nodes
      for (let i = 0; i < 12; i++) {
        const nx = Math.random() * width
        const ny = Math.random() * height
        g.fillStyle(accent, 0.5)
        g.fillCircle(nx, ny, 4)
      }
    } else if (this.world.theme === 'void') {
      // Stars
      for (let i = 0; i < 80; i++) {
        const sx = Math.random() * width
        const sy = Math.random() * height
        const sz = Math.random() * 2
        g.fillStyle(0xFFFFFF, 0.4 + Math.random() * 0.6)
        g.fillCircle(sx, sy, sz)
      }
      // Void rifts
      for (let i = 0; i < 3; i++) {
        const rx = (i / 2) * width
        const ry = height / 2
        g.lineStyle(2, accent, 0.5)
        g.strokeEllipse(rx, ry, 60, 100)
        g.lineStyle(1, accent, 0.25)
        g.strokeEllipse(rx, ry, 90, 140)
      }
    }
  }

  private drawPlatforms() {
    const { width, height } = this.scale
    const g = this.platformGraphics
    const pColor = parseInt(this.world.platformColor.replace('#', ''), 16)
    const accent = parseInt(this.world.accentColor.replace('#', ''), 16)

    // Main ground
    g.fillStyle(pColor, 1)
    g.fillRect(0, height - 120, width, 120)

    // Ground edge glow
    g.lineStyle(3, accent, 0.8)
    g.beginPath()
    g.moveTo(0, height - 120)
    g.lineTo(width, height - 120)
    g.strokePath()

    // Platform tiles
    for (let i = 0; i < Math.floor(width / 60); i++) {
      g.lineStyle(1, accent, 0.2)
      g.strokeRect(i * 60, height - 120, 60, 20)
    }

    // Elevated platforms
    const platforms = [
      { x: width * 0.15, y: height - 230, w: 160 },
      { x: width * 0.65, y: height - 230, w: 160 },
      { x: width * 0.4, y: height - 320, w: 140 },
    ]
    platforms.forEach(p => {
      g.fillStyle(pColor, 0.9)
      g.fillRect(p.x - p.w / 2, p.y, p.w, 18)
      g.lineStyle(2, accent, 0.6)
      g.strokeRect(p.x - p.w / 2, p.y, p.w, 18)
    })
  }

  private createPlayerSprite() {
    const { width, height } = this.scale
    const startX = width * 0.25
    const startY = this.groundY

    this.playerShadow = this.add.ellipse(startX, startY + 2, 50, 10, 0x000000, 0.3)

    const g = this.add.graphics()
    this.drawPlayer(g, 0, 0, false)

    // Eyes as separate objects for animation
    const leftEye = this.add.ellipse(-10, -28, 8, 8, 0x00ffff)
    const rightEye = this.add.ellipse(10, -28, 8, 8, 0x00ffff)
    const leftPupil = this.add.ellipse(-10, -28, 4, 4, 0x000000)
    const rightPupil = this.add.ellipse(10, -28, 4, 4, 0x000000)

    this.playerBody = this.add.container(startX, startY, [g, leftEye, rightEye, leftPupil, rightPupil])
    this.playerVelX = 0
    this.playerVelY = 0
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics, x: number, y: number, isAttacking: boolean) {
    g.clear()
    const playerColor = isAttacking ? 0x00ffff : 0x4488ff
    const darkColor = isAttacking ? 0x0099cc : 0x2244aa

    // Body
    g.fillStyle(playerColor, 1)
    g.fillRoundedRect(x - 18, y - 50, 36, 50, 6)

    // Head
    g.fillStyle(playerColor, 1)
    g.fillCircle(x, y - 62, 18)

    // Helmet
    g.fillStyle(darkColor, 1)
    g.fillRoundedRect(x - 20, y - 82, 40, 22, 4)

    // Visor
    g.fillStyle(isAttacking ? 0xffffff : 0x00ccff, 0.9)
    g.fillRoundedRect(x - 14, y - 76, 28, 10, 3)

    // Arms
    g.fillStyle(darkColor, 1)
    g.fillRoundedRect(x - 28, y - 48, 12, 32, 4)
    g.fillRoundedRect(x + 16, y - 48, 12, 32, 4)

    // Legs
    g.fillStyle(darkColor, 1)
    g.fillRoundedRect(x - 15, y - 8, 12, 26, 3)
    g.fillRoundedRect(x + 3, y - 8, 12, 26, 3)

    // Boots
    g.fillStyle(0x222244, 1)
    g.fillRoundedRect(x - 18, y + 16, 14, 8, 2)
    g.fillRoundedRect(x + 4, y + 16, 14, 8, 2)

    // Attack flash
    if (isAttacking) {
      g.lineStyle(3, 0x00ffff, 0.8)
      g.strokeCircle(x, y - 30, 35)
    }
  }

  private createBossSprite() {
    const { width, height } = this.scale
    const startX = width * 0.75
    const startY = this.groundY

    this.bossShadow = this.add.ellipse(startX, startY + 2, this.boss.size * 0.8, 12, 0x000000, 0.3)

    const g = this.add.graphics()
    this.drawBoss(g, 0, 0, this.boss, 1)

    this.bossBody = this.add.container(startX, startY, [g])
  }

  private drawBoss(g: Phaser.GameObjects.Graphics, x: number, y: number, boss: Boss, phase: number) {
    g.clear()
    const bossColorHex = parseInt(boss.color.replace('#', ''), 16)
    const eyeColorHex = parseInt(boss.eyeColor.replace('#', ''), 16)
    const size = boss.size

    // Phase colors
    const phaseMultiplier = phase === 3 ? 0xff3300 : phase === 2 ? 0xff8800 : bossColorHex
    const finalColor = phase === 1 ? bossColorHex : phaseMultiplier

    // Body
    g.fillStyle(finalColor, 1)
    g.fillRoundedRect(x - size / 2, y - size, size, size, 10)

    // Head
    g.fillStyle(finalColor, 1)
    g.fillCircle(x, y - size - size * 0.35, size * 0.4)

    // Dark body detail
    g.fillStyle(0x000000, 0.2)
    g.fillRoundedRect(x - size / 2 + 8, y - size + 8, size - 16, size - 16, 6)

    // Eyes
    const eyeSize = size * 0.15
    g.fillStyle(eyeColorHex, 1)
    g.fillCircle(x - size * 0.15, y - size - size * 0.4, eyeSize)
    g.fillCircle(x + size * 0.15, y - size - size * 0.4, eyeSize)

    // Pupils (red in phase 2+)
    const pupilColor = phase >= 2 ? 0xff0000 : 0x000000
    g.fillStyle(pupilColor, 1)
    g.fillCircle(x - size * 0.15, y - size - size * 0.4, eyeSize * 0.5)
    g.fillCircle(x + size * 0.15, y - size - size * 0.4, eyeSize * 0.5)

    // Mouth (angry in phase 2+)
    g.fillStyle(0x000000, 0.8)
    if (phase >= 2) {
      // Angry teeth
      g.fillRect(x - size * 0.25, y - size - size * 0.2, size * 0.5, size * 0.12)
      for (let i = 0; i < 5; i++) {
        g.fillStyle(0xffffff, 1)
        g.fillTriangle(
          x - size * 0.2 + i * (size * 0.1), y - size - size * 0.2,
          x - size * 0.15 + i * (size * 0.1), y - size - size * 0.1,
          x - size * 0.1 + i * (size * 0.1), y - size - size * 0.2
        )
      }
    } else {
      g.fillCircle(x, y - size - size * 0.15, size * 0.12)
    }

    // Arms
    g.fillStyle(finalColor, 1)
    g.fillRoundedRect(x - size * 0.8, y - size * 0.7, size * 0.3, size * 0.6, 5)
    g.fillRoundedRect(x + size * 0.5, y - size * 0.7, size * 0.3, size * 0.6, 5)

    // Phase aura
    if (phase >= 2) {
      g.lineStyle(3, phase === 3 ? 0xff0000 : 0xff8800, 0.6)
      g.strokeCircle(x, y - size / 2, size * 0.8)
    }
    if (phase === 3) {
      g.lineStyle(2, 0xff0000, 0.4)
      g.strokeCircle(x, y - size / 2, size * 1.1)
    }
  }

  private createHUD() {
    const { width, height } = this.scale

    this.playerHPBar = this.add.graphics()
    this.bossHPBar = this.add.graphics()

    // Boss name
    this.bossNameText = this.add.text(width / 2, 12, `${this.boss.name.toUpperCase()}`, {
      fontSize: '14px',
      fontFamily: "'Press Start 2P', monospace",
      color: this.world.accentColor,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0)

    // Phase indicator
    this.phaseText = this.add.text(width / 2, 30, '⚔ PHASE 1', {
      fontSize: '10px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0)

    // Combo text
    this.comboText = this.add.text(width / 2, height / 2 - 60, '', {
      fontSize: '24px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0)

    // Gear needed warning
    this.gearNeededText = this.add.text(width / 2, height - 140, '', {
      fontSize: '10px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0)

    // Unlock button
    const btnBg = this.add.rectangle(0, 0, 200, 36, 0xff6600, 1)
    const btnText = this.add.text(0, 0, '🔓 UNLOCK GEAR', {
      fontSize: '9px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#ffffff',
    }).setOrigin(0.5)
    this.unlockBtn = this.add.container(width / 2, height - 100, [btnBg, btnText])
    this.unlockBtn.setAlpha(0)
    this.unlockBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -18, 200, 36), Phaser.Geom.Rectangle.Contains)
    this.unlockBtn.on('pointerdown', () => this.triggerGearUnlock())
    this.unlockBtn.on('pointerover', () => btnBg.setFillStyle(0xff8800))
    this.unlockBtn.on('pointerout', () => btnBg.setFillStyle(0xff6600))

    // Controls hint
    this.add.text(10, height - 50, 'WASD/ARROWS: Move  SPACE: Attack  SHIFT: Dodge', {
      fontSize: '7px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2,
    })

    this.updateHPBars()
  }

  private updateHPBars() {
    const { width } = this.scale

    // Player HP bar (bottom left)
    const pg = this.playerHPBar
    pg.clear()
    const pBarW = 200
    const pBarH = 18
    const px = 15
    const py = this.scale.height - 85
    pg.fillStyle(0x000000, 0.7)
    pg.fillRoundedRect(px - 2, py - 2, pBarW + 4, pBarH + 4, 4)
    pg.fillStyle(0x333333, 1)
    pg.fillRect(px, py, pBarW, pBarH)
    const pFill = Math.max(0, (this.playerHP / this.playerMaxHP))
    const pColor = pFill > 0.5 ? 0x00cc44 : pFill > 0.25 ? 0xffaa00 : 0xff2222
    pg.fillStyle(pColor, 1)
    pg.fillRect(px, py, Math.floor(pBarW * pFill), pBarH)
    pg.lineStyle(1, 0x00ff88, 0.5)
    pg.strokeRect(px, py, pBarW, pBarH)

    // Boss HP bar (top center)
    const bg = this.bossHPBar
    bg.clear()
    const bBarW = 300
    const bBarH = 20
    const bx = width / 2 - bBarW / 2
    const by = 52
    bg.fillStyle(0x000000, 0.7)
    bg.fillRoundedRect(bx - 2, by - 2, bBarW + 4, bBarH + 4, 4)
    bg.fillStyle(0x333333, 1)
    bg.fillRect(bx, by, bBarW, bBarH)
    const bFill = Math.max(0, (this.bossHP / this.bossMaxHP))
    const bColor = bFill > 0.5 ? 0xdd2222 : bFill > 0.25 ? 0xff4400 : 0xff8800
    bg.fillStyle(bColor, 1)
    bg.fillRect(bx, by, Math.floor(bBarW * bFill), bBarH)
    bg.lineStyle(1, 0xff4444, 0.5)
    bg.strokeRect(bx, by, bBarW, bBarH)

    // HP numbers
    if (!this.playerHPText) {
      this.playerHPText = this.add.text(px + pBarW / 2, py + pBarH / 2, '', {
        fontSize: '9px',
        fontFamily: "'Press Start 2P', monospace",
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
    }
    this.playerHPText.setText(`HP: ${this.playerHP}/${this.playerMaxHP}`)
    this.playerHPText.setPosition(px + pBarW / 2, py + pBarH / 2)

    if (!this.bossHPText) {
      this.bossHPText = this.add.text(bx + bBarW / 2, by + bBarH / 2, '', {
        fontSize: '9px',
        fontFamily: "'Press Start 2P', monospace",
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5)
    }
    this.bossHPText.setText(`${this.bossHP}/${this.bossMaxHP}`)
    this.bossHPText.setPosition(bx + bBarW / 2, by + bBarH / 2)
  }

  // TS doesn't complain when declared here
  private playerHPText!: Phaser.GameObjects.Text
  private bossHPText!: Phaser.GameObjects.Text

  private setupInput() {
    const kb = this.input.keyboard!
    this.keys = {
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      q: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    }
  }

  private setupEventListeners() {
    eventBus.on(EVENTS.RESUME_BATTLE, this.onResumeBattle.bind(this))
    eventBus.on(EVENTS.GEAR_EQUIPPED, this.onGearEquipped.bind(this))
    eventBus.on(EVENTS.PLAYER_DIED, this.onPlayerDied.bind(this))
  }

  private onResumeBattle() {
    this.paused = false
    this.missingGear = null
    this.gearNeededText.setAlpha(0)
    this.unlockBtn.setAlpha(0)
  }

  private onGearEquipped(gear: unknown) {
    const g = gear as GearItem
    if (!this.equippedGear.find(e => e.id === g.id)) {
      this.equippedGear.push(g)
    }
  }

  private onPlayerDied() {
    this.scene.stop()
  }

  private showBossEntrance() {
    const { width, height } = this.scale
    const entranceText = this.add.text(width / 2, height / 2 - 20, this.boss.name, {
      fontSize: '22px',
      fontFamily: "'Press Start 2P', monospace",
      color: this.boss.color,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0)

    const subtitleText = this.add.text(width / 2, height / 2 + 20, this.boss.title, {
      fontSize: '11px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: [entranceText, subtitleText],
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        entranceText.destroy()
        subtitleText.destroy()
      }
    })

    // Screen flash
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.8)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy()
    })
  }

  update(time: number, delta: number) {
    if (this.paused || this.bossDefeated) return

    const dt = delta / 1000

    this.handleInput(dt)
    this.applyPhysics(dt)
    this.updateBossAI(dt)
    this.updateProjectiles(dt)
    this.updateParticles(dt)
    this.updateCooldowns(delta)
    this.updateVisuals(dt)
    this.checkBossPhase()
    this.frameTime += delta
  }

  private handleInput(dt: number) {
    const speed = 280 + (this.equippedGear.reduce((s, g) => s + g.speedBonus, 0) * 2)
    const goLeft = this.keys.left.isDown || this.keys.a.isDown
    const goRight = this.keys.right.isDown || this.keys.d.isDown
    const goUp = this.keys.up.isDown || this.keys.w.isDown
    const attackKey = this.keys.space.isDown
    const dodgeKey = this.keys.shift.isDown

    if (goLeft) {
      this.playerVelX = -speed
      this.playerFacingRight = false
    } else if (goRight) {
      this.playerVelX = speed
      this.playerFacingRight = true
    } else {
      this.playerVelX *= 0.75
    }

    if (goUp && this.playerOnGround) {
      this.playerVelY = -700
      this.playerOnGround = false
      this.spawnJumpParticles()
    }

    if (attackKey && this.attackCooldown <= 0 && !this.isPlayerAttacking) {
      this.performAttack()
    }

    if (dodgeKey && this.dodgeCooldown <= 0) {
      this.performDodge()
    }
  }

  private performAttack() {
    this.isPlayerAttacking = true
    this.attackCooldown = this.attackCooldownMax

    const bossX = this.bossBody.x
    const bossY = this.bossBody.y
    const playerX = this.playerBody.x
    const dist = Math.abs(bossX - playerX)

    // Check if we have required gear
    const hasGear = this.boss.requiredGear.every(gearId =>
      this.equippedGear.some(g => g.id === gearId)
    )

    if (!hasGear && dist < 250) {
      // Find first missing gear
      const missingId = this.boss.requiredGear.find(gearId =>
        !this.equippedGear.some(g => g.id === gearId)
      )
      if (missingId) {
        const missingGear = getGearById(missingId)
        if (missingGear) {
          this.missingGear = missingGear
          this.showGearNeededPrompt(missingGear)
        }
      }
    }

    // Damage based on gear
    if (dist < 220) {
      let dmg = 10 + (this.equippedGear.length * 8)
      this.equippedGear.forEach(g => {
        dmg += g.attackBonus * 0.3
        if (this.boss.weakGear.includes(g.id)) dmg *= 1.5
      })
      if (!hasGear) dmg = Math.floor(dmg * 0.2)
      dmg = Math.floor(dmg)

      this.dealDamageToBoss(dmg)
      this.spawnHitParticles(bossX, bossY - this.boss.size / 2)
    }

    // Launch attack projectile
    const angle = Math.atan2(bossY - (this.playerBody.y - 40), bossX - this.playerBody.x)
    this.spawnPlayerProjectile(
      this.playerBody.x + (this.playerFacingRight ? 30 : -30),
      this.playerBody.y - 35,
      Math.cos(angle) * 500,
      Math.sin(angle) * 300,
      this.equippedGear.length > 0 ? 0x00ffff : 0x4488ff
    )

    setTimeout(() => { this.isPlayerAttacking = false }, 250)
  }

  private performDodge() {
    this.dodgeCooldown = 1500
    this.isInvincible = true
    this.invincibleTimer = 600
    const dir = this.playerFacingRight ? 1 : -1
    this.playerVelX = dir * -500  // Dash backward
    this.spawnDodgeParticles()
  }

  private spawnPlayerProjectile(x: number, y: number, vx: number, vy: number, color: number) {
    const p = this.add.ellipse(x, y, 14, 14, color, 1) as Projectile
    p.vx = vx
    p.vy = vy
    p.damage = 0  // visual only, damage already done
    this.projectiles.push(p)
    // Glow
    this.add.ellipse(x, y, 24, 24, color, 0.3)
    setTimeout(() => {
      if (p.active) p.destroy()
    }, 600)
  }

  private dealDamageToBoss(amount: number) {
    this.bossHP = Math.max(0, this.bossHP - amount)
    this.updateHPBars()
    this.screenShake = 8
    this.combo++
    this.score += amount * (1 + this.combo * 0.1)
    eventBus.emit(EVENTS.BOSS_DAMAGED, { amount, bossHp: this.bossHP })
    eventBus.emit(EVENTS.SCORE_UPDATE, { score: Math.floor(this.score) })
    eventBus.emit(EVENTS.COMBO_UPDATE, { combo: this.combo })

    // Boss flash
    this.flashTimer = 150
    this.tweens.add({
      targets: this.bossBody,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
    })

    // Damage number
    this.showDamageNumber(this.bossBody.x, this.bossBody.y - this.boss.size - 10, amount, true)

    // Combo display
    if (this.combo >= 3) {
      this.comboText.setText(`${this.combo}x COMBO!`)
      this.comboText.setAlpha(1)
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 1000,
        delay: 500,
      })
    }

    if (this.bossHP <= 0) this.handleBossDefeated()
  }

  private showGearNeededPrompt(gear: GearItem) {
    this.gearNeededText.setText(`⚠ BOSS IMMUNE!\n${gear.emoji} Unlock: ${gear.name}`)
    this.gearNeededText.setAlpha(1)
    this.unlockBtn.setAlpha(1)

    this.tweens.add({
      targets: this.gearNeededText,
      alpha: 0,
      duration: 500,
      delay: 4000,
    })
    this.tweens.add({
      targets: this.unlockBtn,
      alpha: 0,
      duration: 500,
      delay: 4000,
    })
  }

  private triggerGearUnlock() {
    if (!this.missingGear) return
    const question = getQuestionByGearReward(this.missingGear.id)
      || QUESTIONS.find(q => q.category === this.missingGear!.category)
    if (question) {
      this.paused = true
      eventBus.emit(EVENTS.GEAR_NEEDED, { gear: this.missingGear, question })
    }
  }

  private updateBossAI(dt: number) {
    if (!this.bossBody || !this.playerBody) return

    const bx = this.bossBody.x
    const by = this.bossBody.y
    const px = this.playerBody.x
    const py = this.playerBody.y
    const dist = Math.abs(bx - px)
    const speedMult = this.bossPhase === 3 ? 1.8 : this.bossPhase === 2 ? 1.35 : 1

    // Face player
    this.bossFacingRight = px < bx

    // Choose behavior
    if (this.bossCharging) {
      this.bossVelX = this.bossChargeVelX
    } else if (dist < 80) {
      // Too close: back off
      this.bossVelX = (bx > px ? 1 : -1) * 80 * speedMult
    } else if (dist < 200) {
      // Attack range: slow approach
      this.bossVelX = (px - bx > 0 ? 1 : -1) * 100 * speedMult
    } else {
      // Chase
      this.bossVelX = (px - bx > 0 ? 1 : -1) * this.boss.baseSpeed * speedMult
    }

    // Boss attack timer
    const attackIdx = this.bossAttackIndex % this.boss.attackPatterns.length
    const pattern = this.boss.attackPatterns[attackIdx]
    const cooldownMult = this.bossPhase === 3 ? 0.5 : this.bossPhase === 2 ? 0.7 : 1

    if (this.bossAttackTimer <= 0) {
      this.executeBossAttack(pattern, px, py)
      this.bossAttackTimer = pattern.cooldown * cooldownMult
      this.bossAttackIndex++
    }

    // Apply physics
    this.bossVelY += this.gravity * dt
    this.bossBody.x += this.bossVelX * dt
    this.bossBody.y += this.bossVelY * dt

    // Clamp to ground
    const { width } = this.scale
    if (this.bossBody.y >= this.groundY) {
      this.bossBody.y = this.groundY
      this.bossVelY = 0
      this.bossOnGround = true
      this.bossCharging = false
    }

    // Keep in bounds
    const halfSize = this.boss.size / 2
    this.bossBody.x = Phaser.Math.Clamp(this.bossBody.x, halfSize + 20, width - halfSize - 20)
    this.bossShadow.setPosition(this.bossBody.x, this.groundY + 2)
  }

  private executeBossAttack(pattern: Boss['attackPatterns'][0], px: number, py: number) {
    const bx = this.bossBody.x
    const by = this.bossBody.y

    switch (pattern.type) {
      case 'projectile': {
        const angle = Math.atan2((py - 40) - (by - this.boss.size / 2), px - bx)
        for (let i = -1; i <= 1; i++) {
          const spread = this.bossPhase === 3 ? i * 0.3 : i * 0.15
          const p = this.add.ellipse(
            bx + Math.cos(angle) * 40,
            by - this.boss.size / 2,
            pattern.width || 14,
            pattern.height || 14,
            parseInt(pattern.color.replace('#', ''), 16),
            1
          ) as Projectile
          p.vx = Math.cos(angle + spread) * pattern.speed
          p.vy = Math.sin(angle + spread) * pattern.speed
          p.damage = pattern.damage
          this.projectiles.push(p)
        }
        break
      }
      case 'charge': {
        const dir = px > bx ? 1 : -1
        this.bossCharging = true
        this.bossChargeVelX = dir * pattern.speed
        this.bossVelY = -300
        this.bossOnGround = false
        setTimeout(() => { this.bossCharging = false }, 800)
        this.screenShake = 5
        break
      }
      case 'slam': {
        if (this.bossOnGround) {
          this.bossVelY = -500
          this.bossOnGround = false
          setTimeout(() => {
            this.bossVelY = 800
            setTimeout(() => {
              this.screenShake = 15
              this.spawnShockwave(bx, this.groundY)
              // Check player proximity
              if (Math.abs(px - bx) < 120) {
                this.dealDamageToPlayer(pattern.damage, bx, this.groundY)
              }
            }, 400)
          }, 300)
        }
        break
      }
      case 'laser': {
        this.flashTimer = 200
        const laserColor = parseInt(pattern.color.replace('#', ''), 16)
        const laser = this.add.rectangle(
          (bx + px) / 2, by - this.boss.size / 2,
          Math.abs(bx - px) + 100, 16,
          laserColor, 0.9
        )
        this.tweens.add({
          targets: laser,
          alpha: 0,
          scaleY: 2,
          duration: 600,
          onComplete: () => laser.destroy()
        })
        // Check if player is hit (simplified line check)
        const minX = Math.min(bx, px) - 20
        const maxX = Math.max(bx, px) + 20
        if (px >= minX && px <= maxX && Math.abs((py - 40) - (by - this.boss.size / 2)) < 80) {
          this.dealDamageToPlayer(pattern.damage, px, py)
        }
        this.screenShake = 12
        break
      }
      case 'teleport': {
        const { width } = this.scale
        const newX = px > bx
          ? Phaser.Math.Between(50, px - 100)
          : Phaser.Math.Between(px + 100, width - 50)
        // Flash effect
        const teleFlash = this.add.circle(bx, by - this.boss.size / 2, 60, parseInt(pattern.color.replace('#', ''), 16), 0.8)
        this.tweens.add({
          targets: teleFlash,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 300,
          onComplete: () => teleFlash.destroy()
        })
        this.bossBody.setAlpha(0)
        setTimeout(() => {
          this.bossBody.x = newX
          this.bossBody.setAlpha(1)
          const arriFlash = this.add.circle(newX, by - this.boss.size / 2, 60, parseInt(pattern.color.replace('#', ''), 16), 0.8)
          this.tweens.add({
            targets: arriFlash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 300,
            onComplete: () => arriFlash.destroy()
          })
        }, 300)
        break
      }
      case 'summon': {
        // Spawn minion projectiles in all directions
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const p = this.add.ellipse(
            bx, by - this.boss.size / 2,
            16, 16,
            parseInt(pattern.color.replace('#', ''), 16),
            1
          ) as Projectile
          p.vx = Math.cos(angle) * 180
          p.vy = Math.sin(angle) * 180
          p.damage = pattern.damage
          this.projectiles.push(p)
        }
        this.screenShake = 8
        break
      }
    }
  }

  private dealDamageToPlayer(amount: number, fromX: number, fromY: number) {
    if (this.isInvincible) return

    const defense = this.equippedGear.reduce((s, g) => s + g.defenseBonus, 0)
    const reducedDmg = Math.max(1, amount - Math.floor(defense * 0.3))
    this.playerHP = Math.max(0, this.playerHP - reducedDmg)
    this.updateHPBars()
    this.screenShake = 12
    this.combo = 0  // Reset combo on hit

    eventBus.emit(EVENTS.PLAYER_DAMAGED, { amount: reducedDmg })
    this.showDamageNumber(this.playerBody.x, this.playerBody.y - 80, reducedDmg, false)

    // Player knockback
    this.playerVelX = (this.playerBody.x > fromX ? 1 : -1) * 350
    this.playerVelY = -400
    this.playerOnGround = false

    // Brief invincibility on hit
    this.isInvincible = true
    this.invincibleTimer = 800

    // Flash player red
    this.tweens.add({
      targets: this.playerBody,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
    })

    if (this.playerHP <= 0) {
      eventBus.emit(EVENTS.PLAYER_DAMAGED, { amount: reducedDmg, fatal: true })
    }
  }

  private applyPhysics(dt: number) {
    this.playerVelY += this.gravity * dt
    this.playerBody.x += this.playerVelX * dt
    this.playerBody.y += this.playerVelY * dt

    // Ground collision
    if (this.playerBody.y >= this.groundY) {
      this.playerBody.y = this.groundY
      this.playerVelY = 0
      this.playerOnGround = true
    }

    // Platform collisions
    const { width } = this.scale
    const platforms = [
      { x: width * 0.15, y: this.groundY - 110, w: 160 },
      { x: width * 0.65, y: this.groundY - 110, w: 160 },
      { x: width * 0.4, y: this.groundY - 200, w: 140 },
    ]
    platforms.forEach(p => {
      if (
        this.playerBody.x > p.x - p.w / 2 &&
        this.playerBody.x < p.x + p.w / 2 &&
        this.playerBody.y <= p.y + 20 &&
        this.playerBody.y >= p.y &&
        this.playerVelY > 0
      ) {
        this.playerBody.y = p.y
        this.playerVelY = 0
        this.playerOnGround = true
      }
    })

    // World bounds
    this.playerBody.x = Phaser.Math.Clamp(this.playerBody.x, 20, width - 20)
    this.playerShadow.setPosition(this.playerBody.x, this.groundY + 2)

    // Update player sprite appearance
    const g = this.playerBody.list[0] as Phaser.GameObjects.Graphics
    this.drawPlayer(g, 0, 0, this.isPlayerAttacking)
    this.playerBody.setScale(this.playerFacingRight ? 1 : -1)
  }

  private updateProjectiles(dt: number) {
    const { width, height } = this.scale
    const toRemove: number[] = []

    this.projectiles.forEach((p, i) => {
      if (!p.active) { toRemove.push(i); return }

      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 200 * dt  // gravity on projectiles

      // Hit player check
      if (p.damage > 0) {
        const distToPlayer = Phaser.Math.Distance.Between(
          p.x, p.y,
          this.playerBody.x, this.playerBody.y - 40
        )
        if (distToPlayer < 30) {
          this.dealDamageToPlayer(p.damage, p.x, p.y)
          this.spawnHitParticles(p.x, p.y)
          p.destroy()
          toRemove.push(i)
          return
        }
      }

      // Remove out of bounds projectiles
      if (p.x < -50 || p.x > width + 50 || p.y > height + 50) {
        p.destroy()
        toRemove.push(i)
      }
    })

    // Remove destroyed projectiles
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(toRemove[i], 1)
    }
  }

  private updateParticles(dt: number) {
    const toRemove: number[] = []
    this.particles.forEach((p, i) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 400 * dt
      p.life -= this.delta
      if (p.life <= 0) toRemove.push(i)
    })

    const fg = this.fxGraphics
    fg.clear()
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife)
      fg.fillStyle(p.color, alpha)
      fg.fillCircle(p.x, p.y, p.size * alpha)
    })

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1)
    }
  }

  private delta = 16  // fallback delta for particle system

  private updateCooldowns(delta: number) {
    this.delta = delta
    if (this.attackCooldown > 0) this.attackCooldown -= delta
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta
      if (this.invincibleTimer <= 0) this.isInvincible = false
    }
    if (this.bossAttackTimer > 0) this.bossAttackTimer -= delta
    if (this.screenShake > 0) {
      this.screenShake -= 0.5
      const shakeX = (Math.random() - 0.5) * this.screenShake
      const shakeY = (Math.random() - 0.5) * this.screenShake
      this.cameras.main.setScroll(shakeX, shakeY)
    } else {
      this.cameras.main.setScroll(0, 0)
    }
    if (this.flashTimer > 0) {
      this.flashTimer -= delta
    }
  }

  private updateVisuals(_dt: number) {
    // Boss redraw when phase changes or charging
    const bossG = this.bossBody.list[0] as Phaser.GameObjects.Graphics
    this.drawBoss(bossG, 0, 0, this.boss, this.bossPhase)
    this.bossBody.setScale(this.bossFacingRight ? 1 : -1)

    // Invincible flicker
    if (this.isInvincible) {
      this.playerBody.setAlpha(Math.sin(this.frameTime * 0.05) > 0 ? 1 : 0.3)
    } else {
      this.playerBody.setAlpha(1)
    }

    // Boss enrage glow
    if (this.bossPhase === 3 && !this.enragedEffect) {
      this.enragedEffect = true
      const glowCircle = this.add.circle(
        this.bossBody.x, this.bossBody.y - this.boss.size / 2,
        this.boss.size * 1.5,
        0xff0000, 0.15
      )
      this.tweens.add({
        targets: glowCircle,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private checkBossPhase() {
    const pct = (this.bossHP / this.bossMaxHP) * 100
    const newPhase: 1 | 2 | 3 = pct > this.boss.phase2HP ? 1 : pct > this.boss.phase3HP ? 2 : 3

    if (newPhase !== this.bossPhase) {
      this.bossPhase = newPhase
      eventBus.emit(EVENTS.BOSS_PHASE_CHANGE, { phase: newPhase })
      if (newPhase === 2 || newPhase === 3) this.showPhaseTransition(newPhase)
    }
  }

  private showPhaseTransition(phase: 2 | 3) {
    const { width, height } = this.scale
    const msg = phase === 3 ? '🔥 ENRAGED!' : '⚠ PHASE 2!'
    const color = phase === 3 ? '#ff0000' : '#ff8800'

    const t = this.add.text(width / 2, height / 2, msg, {
      fontSize: '28px',
      fontFamily: "'Press Start 2P', monospace",
      color,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    this.phaseText.setText(`⚔ PHASE ${phase}`)

    this.tweens.add({
      targets: t,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1500,
      onComplete: () => t.destroy()
    })

    // Screen flash
    const flash = this.add.rectangle(width / 2, height / 2, width, height, phase === 3 ? 0xff0000 : 0xff8800, 0.3)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy()
    })

    this.screenShake = 20
    this.bossAttackCooldownMultiplier = phase === 3 ? 0.5 : 0.7
  }

  private bossAttackCooldownMultiplier = 1

  private handleBossDefeated() {
    this.bossDefeated = true
    this.bossHP = 0
    this.updateHPBars()

    const { width, height } = this.scale

    // Death explosion
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2
      const speed = 150 + Math.random() * 300
      this.particles.push({
        x: this.bossBody.x,
        y: this.bossBody.y - this.boss.size / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200,
        life: 1200,
        maxLife: 1200,
        color: parseInt(this.boss.color.replace('#', ''), 16),
        size: 6 + Math.random() * 8,
      })
    }

    // Boss defeat animation
    this.tweens.add({
      targets: this.bossBody,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 800,
      onComplete: () => {
        this.bossBody.destroy()

        // Victory text
        const vt = this.add.text(width / 2, height / 2 - 30, '⚔ VICTORY! ⚔', {
          fontSize: '22px',
          fontFamily: "'Press Start 2P', monospace",
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 6,
        }).setOrigin(0.5).setAlpha(0)

        const xpText = this.add.text(width / 2, height / 2 + 20, `+${this.boss.xpReward} XP  +${this.score.toFixed(0)} SCORE`, {
          fontSize: '12px',
          fontFamily: "'Press Start 2P', monospace",
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setAlpha(0)

        this.tweens.add({
          targets: [vt, xpText],
          alpha: 1,
          duration: 400,
          hold: 2000,
          onComplete: () => {
            eventBus.emit(EVENTS.BOSS_DEFEATED, { boss: this.boss, xpReward: this.boss.xpReward })
          }
        })
      }
    })

    this.screenShake = 25
  }

  private showDamageNumber(x: number, y: number, amount: number, isBoss: boolean) {
    const color = isBoss ? '#ff6600' : '#ff2222'
    const t = this.add.text(x + (Math.random() - 0.5) * 40, y, `-${amount}`, {
      fontSize: '14px',
      fontFamily: "'Press Start 2P', monospace",
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.damageTexts.push({ obj: t, life: 1000 })
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => t.destroy()
    })
  }

  private spawnHitParticles(x: number, y: number) {
    const bossColorHex = parseInt(this.boss.color.replace('#', ''), 16)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const speed = 100 + Math.random() * 200
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 500,
        maxLife: 500,
        color: i % 2 === 0 ? 0x00ffff : bossColorHex,
        size: 3 + Math.random() * 4,
      })
    }
  }

  private spawnJumpParticles() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.playerBody.x + (Math.random() - 0.5) * 30,
        y: this.playerBody.y,
        vx: (Math.random() - 0.5) * 150,
        vy: 50 + Math.random() * 100,
        life: 400,
        maxLife: 400,
        color: 0x4488ff,
        size: 2 + Math.random() * 3,
      })
    }
  }

  private spawnDodgeParticles() {
    const dir = this.playerFacingRight ? 1 : -1
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.playerBody.x,
        y: this.playerBody.y - 30,
        vx: -dir * (200 + Math.random() * 200),
        vy: (Math.random() - 0.5) * 100,
        life: 400,
        maxLife: 400,
        color: 0x00ffff,
        size: 2 + Math.random() * 4,
      })
    }
  }

  private spawnShockwave(x: number, y: number) {
    const ring = this.add.circle(x, y - 10, 20, 0xffffff, 0.7)
    this.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      onComplete: () => ring.destroy()
    })
  }

  shutdown() {
    eventBus.off(EVENTS.RESUME_BATTLE, this.onResumeBattle.bind(this))
    eventBus.off(EVENTS.GEAR_EQUIPPED, this.onGearEquipped.bind(this))
    eventBus.off(EVENTS.PLAYER_DIED, this.onPlayerDied.bind(this))
  }
}
