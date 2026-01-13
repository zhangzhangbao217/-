<template>
  <div class="sweet-escape-game">
    <!-- 游戏开始菜单 -->
    <div v-if="!gameStarted" class="game-menu">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-logo">🏃‍♂️💕🏃‍♀️</div>
        <h1>甜蜜逃生：终极协作</h1>
        <p class="desc">这不是一个人的战斗。你需要和你的另一半紧密配合，利用开关、躲避陷阱，共同回到属于你们的家。</p>
        
        <div class="menu-actions">
          <el-button v-if="hasSave" type="primary" size="large" round @click="startGame(true)">
            继续旅程 (第 {{ savedLevel }} 关)
          </el-button>
          <el-button :type="hasSave ? 'default' : 'primary'" size="large" round @click="startGame(false)">
            开启新生活
          </el-button>
        </div>

        <div class="game-tips">
          <div class="tip-item">👦 WASD 移动</div>
          <div class="tip-item">👧 方向键 移动</div>
          <div class="tip-item">💖 踩住开关开启大门</div>
        </div>
      </div>
    </div>

    <!-- 游戏主舞台 -->
    <div v-else class="game-stage" :class="{ 'level-transition': isTransitioning }">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="level-badge">
          <span class="level-num">LEVEL {{ currentLevel }}</span>
          <span class="level-name">{{ levels[currentLevel-1]?.name }}</span>
        </div>
      </div>

      <div class="game-world" ref="gameWorld" :style="worldStyle">
        <!-- 动态浪漫背景 -->
        <div class="world-bg-effects">
          <div v-for="n in 15" :key="'bg-heart-'+n" class="floating-heart" :style="getRandomHeartStyle()">❤️</div>
        </div>
        
        <!-- 装饰性动态网格 -->
        <div class="world-grid"></div>
        <div class="world-scanner"></div>

        <!-- 陷阱 (💔) -->
        <div v-for="(trap, i) in traps" :key="'trap-'+i" 
             class="world-trap"
             :style="{ left: trap.x + 'px', top: trap.y + 'px', width: trap.w + 'px', height: trap.h + 'px' }">
          <div class="trap-glow"></div>
          <div class="trap-border"></div>
          <div class="trap-icon">💔</div>
        </div>

        <!-- 障碍物 (墙) -->
        <div v-for="(obs, i) in obstacles" :key="'obs-'+i" 
             class="world-wall"
             :style="{ left: obs.x + 'px', top: obs.y + 'px', width: obs.w + 'px', height: obs.h + 'px' }">
          <div class="wall-neon"></div>
          <div class="wall-pattern"></div>
        </div>

        <!-- 机关开关 -->
        <div v-for="(sw, i) in switches" :key="'sw-'+i" 
             class="world-switch"
             :class="{ active: sw.active }"
             :style="{ left: sw.x + 'px', top: sw.y + 'px', width: sw.w + 'px', height: sw.h + 'px' }">
          <div class="switch-glow"></div>
          <div class="switch-core">
            <span class="switch-icon">{{ sw.active ? '💖' : '🤍' }}</span>
          </div>
        </div>

        <!-- 自动门 -->
        <div v-for="(door, i) in doors" :key="'door-'+i" 
             class="world-door"
             :class="{ open: isDoorOpen(door) }"
             :style="{ left: door.x + 'px', top: door.y + 'px', width: door.w + 'px', height: door.h + 'px' }">
          <div class="door-neon"></div>
          <div class="door-particles" v-if="!isDoorOpen(door)"></div>
        </div>

        <!-- 终点 (家) -->
        <div class="world-goal" :style="{ left: goalPos.x + 'px', top: goalPos.y + 'px' }">
          <div class="goal-effect"></div>
          <div class="goal-house">🏠</div>
          <div class="goal-text">我们的家</div>
        </div>

        <!-- 玩家 1 (👦) -->
        <div class="player p1" :style="{ transform: `translate(${p1.x}px, ${p1.y}px)` }">
          <div class="player-trail" v-for="n in 3" :key="'p1-t-'+n" :style="getTrailStyle(p1, n)">❤️</div>
          <div class="player-avatar">👦</div>
          <div class="player-tag">P1</div>
          <div class="player-glow"></div>
        </div>

        <!-- 玩家 2 (👧) -->
        <div class="player p2" :style="{ transform: `translate(${p2.x}px, ${p2.y}px)` }">
          <div class="player-trail" v-for="n in 3" :key="'p2-t-'+n" :style="getTrailStyle(p2, n)">💖</div>
          <div class="player-avatar">👧</div>
          <div class="player-tag">P2</div>
          <div class="player-glow"></div>
        </div>

        <!-- 过场遮罩 -->
        <div class="transition-overlay" v-if="isTransitioning">
          <div class="heart-loader">❤️</div>
        </div>
      </div>

      <!-- 移动端适配控制 -->
      <div class="mobile-footer">
        <div class="char-selector">
          <el-radio-group v-model="activeChar" size="small">
            <el-radio-button label="p1">控制 👦</el-radio-button>
            <el-radio-button label="p2">控制 👧</el-radio-button>
          </el-radio-group>
        </div>
        <div class="dpad">
          <div class="dpad-row">
            <button class="dpad-btn up" @touchstart="setKey('up', true)" @touchend="setKey('up', false)">▲</button>
          </div>
          <div class="dpad-row">
            <button class="dpad-btn left" @touchstart="setKey('left', true)" @touchend="setKey('left', false)">◀</button>
            <button class="dpad-btn down" @touchstart="setKey('down', true)" @touchend="setKey('down', false)">▼</button>
            <button class="dpad-btn right" @touchstart="setKey('right', true)" @touchend="setKey('right', false)">▶</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { GameSaveService } from '../../services/gameSaveService'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
// --- 游戏常数 ---
const PLAYER_SIZE = 30
const WORLD_WIDTH = 800
const WORLD_HEIGHT = 600
const ACCEL = 0.5
const FRICTION = 0.88
const MAX_SPEED = 4.0
const COLLISION_MARGIN = 2 // 碰撞安全边距

// --- 响应式状态 ---
const gameStarted = ref(false)
const hasSave = ref(false)
const savedLevel = ref(1)
const currentLevel = ref(1)
const isTransitioning = ref(false)
const activeChar = ref<'p1' | 'p2'>('p1')
const isShaking = ref(false)
const shakeOffset = reactive({ x: 0, y: 0 })

// 玩家物理状态
const p1 = reactive({ x: 0, y: 0, vx: 0, vy: 0 })
const p2 = reactive({ x: 0, y: 0, vx: 0, vy: 0 })
const goalPos = reactive({ x: 0, y: 0 })

// 摄像机状态
const camera = reactive({ x: 0, y: 0, scale: 1 })

// 关卡元素
const obstacles = ref<any[]>([])
const switches = ref<any[]>([])
const doors = ref<any[]>([])
const traps = ref<any[]>([])

// 输入状态
const keys = reactive<Record<string, boolean>>({})

// --- 关卡数据 (15 关) ---
const levels = [
  {
    name: '协作的开始',
    p1: { x: 100, y: 100 }, p2: { x: 100, y: 400 },
    goal: { x: 650, y: 250 },
    obstacles: [
      { x: 380, y: 0, w: 40, h: 220 },
      { x: 380, y: 340, w: 40, h: 260 }
    ],
    switches: [
      { x: 150, y: 275, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 500, y: 275, w: 50, h: 50, targetDoor: 0, type: 'hold' } // 增加一个接应开关
    ],
    doors: [{ x: 380, y: 220, w: 40, h: 120, id: 0 }]
  },
  {
    name: '心有灵犀',
    p1: { x: 50, y: 50 }, p2: { x: 50, y: 500 },
    goal: { x: 700, y: 280 },
    obstacles: [{ x: 380, y: 0, w: 40, h: 220 }, { x: 380, y: 380, w: 40, h: 220 }],
    switches: [{ x: 700, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 380, y: 220, w: 40, h: 160, id: 0 }]
  },
  {
    name: '延时接应',
    p1: { x: 50, y: 280 }, p2: { x: 100, y: 100 },
    goal: { x: 700, y: 500 },
    obstacles: [
      { x: 250, y: 0, w: 40, h: 240 }, { x: 250, y: 360, w: 40, h: 240 },
      { x: 500, y: 0, w: 40, h: 240 }, { x: 500, y: 360, w: 40, h: 240 }
    ],
    switches: [
      { x: 100, y: 480, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 350, y: 100, w: 50, h: 50, targetDoor: 1, type: 'hold' }
    ],
    doors: [
      { x: 250, y: 240, w: 40, h: 120, id: 0 },
      { x: 500, y: 240, w: 40, h: 120, id: 1 }
    ]
  },
  {
    name: '危险边缘',
    p1: { x: 50, y: 50 }, p2: { x: 700, y: 50 },
    goal: { x: 380, y: 500 },
    traps: [{ x: 200, y: 200, w: 400, h: 80 }],
    obstacles: [{ x: 0, y: 350, w: 300, h: 40 }, { x: 500, y: 350, w: 300, h: 40 }],
    switches: [{ x: 375, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 300, y: 350, w: 200, h: 40, id: 0 }]
  },
  {
    name: '异地恋情',
    p1: { x: 50, y: 50 }, p2: { x: 50, y: 500 },
    goal: { x: 700, y: 280 },
    obstacles: [
      { x: 0, y: 200, w: 250, h: 40 }, { x: 450, y: 200, w: 350, h: 40 },
      { x: 150, y: 400, w: 250, h: 40 }, { x: 550, y: 400, w: 250, h: 40 }
    ],
    switches: [
      { x: 700, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 50, y: 280, w: 50, h: 50, targetDoor: 1, type: 'hold' }
    ],
    doors: [
      { x: 250, y: 200, w: 200, h: 40, id: 0 },
      { x: 400, y: 400, w: 150, h: 40, id: 1 }
    ]
  },
  {
    name: '心碎迷宫',
    p1: { x: 50, y: 50 }, p2: { x: 50, y: 120 },
    goal: { x: 700, y: 500 },
    traps: [{ x: 250, y: 0, w: 80, h: 450 }, { x: 500, y: 150, w: 80, h: 450 }],
    switches: [{ x: 700, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 0, y: 450, w: 800, h: 40, id: 0 }]
  },
  {
    name: '双重机关',
    p1: { x: 50, y: 50 }, p2: { x: 700, y: 50 },
    goal: { x: 380, y: 280 },
    obstacles: [{ x: 250, y: 150, w: 300, h: 300 }],
    switches: [
      { x: 50, y: 500, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 700, y: 500, w: 50, h: 50, targetDoor: 0, type: 'hold' }
    ],
    doors: [{ x: 325, y: 450, w: 150, h: 40, id: 0, logic: 'and' }]
  },
  {
    name: '时空缝隙',
    p1: { x: 100, y: 100 }, p2: { x: 600, y: 100 },
    goal: { x: 380, y: 500 },
    traps: [{ x: 0, y: 250, w: 800, h: 150 }],
    switches: [{ x: 375, y: 100, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 300, y: 250, w: 200, h: 150, id: 0 }]
  },
  {
    name: '窄门',
    p1: { x: 50, y: 280 }, p2: { x: 700, y: 280 },
    goal: { x: 380, y: 50 },
    obstacles: [
      { x: 200, y: 0, w: 40, h: 150 }, { x: 200, y: 250, w: 40, h: 350 },
      { x: 560, y: 0, w: 40, h: 150 }, { x: 560, y: 250, w: 40, h: 350 }
    ],
    switches: [{ x: 375, y: 500, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 200, y: 150, w: 400, h: 40, id: 0 }]
  },
  {
    name: '爱的代价',
    p1: { x: 100, y: 100 }, p2: { x: 100, y: 180 },
    goal: { x: 650, y: 500 },
    traps: [{ x: 350, y: 0, w: 40, h: 250 }, { x: 350, y: 350, w: 40, h: 250 }],
    switches: [{ x: 100, y: 500, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 350, y: 250, w: 40, h: 100, id: 0 }]
  },
  {
    name: '交错人生',
    p1: { x: 50, y: 50 }, p2: { x: 700, y: 500 },
    goal: { x: 380, y: 280 },
    obstacles: [
      { x: 0, y: 150, w: 350, h: 40 },
      { x: 450, y: 410, w: 350, h: 40 }
    ],
    switches: [
      { x: 700, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 50, y: 500, w: 50, h: 50, targetDoor: 1, type: 'hold' }
    ],
    doors: [
      { x: 350, y: 150, w: 100, h: 40, id: 0 },
      { x: 350, y: 410, w: 100, h: 40, id: 1 }
    ]
  },
  {
    name: '绝对防御',
    p1: { x: 380, y: 50 }, p2: { x: 380, y: 500 },
    goal: { x: 50, y: 280 },
    obstacles: [
      { x: 250, y: 150, w: 350, h: 300 },
      { x: 200, y: 150, w: 50, h: 100 },
      { x: 200, y: 350, w: 50, h: 100 }
    ],
    switches: [{ x: 700, y: 280, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 200, y: 250, w: 50, h: 100, id: 0 }]
  },
  {
    name: '最后之舞',
    p1: { x: 50, y: 50 }, p2: { x: 50, y: 500 },
    goal: { x: 700, y: 280 },
    traps: [{ x: 250, y: 0, w: 40, h: 600 }, { x: 500, y: 0, w: 40, h: 600 }],
    switches: [
      { x: 375, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 650, y: 500, w: 50, h: 50, targetDoor: 1, type: 'hold' }
    ],
    doors: [
      { x: 250, y: 240, w: 40, h: 120, id: 0 },
      { x: 500, y: 240, w: 40, h: 120, id: 1 }
    ]
  },
  {
    name: '生死相依',
    p1: { x: 100, y: 100 }, p2: { x: 650, y: 450 },
    goal: { x: 380, y: 280 },
    traps: [{ x: 0, y: 0, w: 800, h: 600 }],
    switches: [{ x: 375, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' }],
    doors: [{ x: 0, y: 0, w: 800, h: 600, id: 0 }]
  },
  {
    name: '永恒的家',
    p1: { x: 50, y: 500 }, p2: { x: 700, y: 500 },
    goal: { x: 380, y: 100 },
    obstacles: [
      { x: 0, y: 200, w: 320, h: 40 },
      { x: 480, y: 200, w: 320, h: 40 }
    ],
    switches: [
      { x: 50, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' },
      { x: 700, y: 50, w: 50, h: 50, targetDoor: 0, type: 'hold' }
    ],
    doors: [{ x: 320, y: 200, w: 160, h: 40, id: 0, logic: 'and' }]
  }
]

// --- 游戏逻辑 ---

let animationFrame: number

const update = () => {
  // 无论是否在切换中，都要继续请求下一帧，防止循环死亡
  animationFrame = requestAnimationFrame(update)

  if (!gameStarted.value || isTransitioning.value) return

  // 更新抖动
  if (isShaking.value) {
    shakeOffset.x = (Math.random() - 0.5) * 10
    shakeOffset.y = (Math.random() - 0.5) * 10
  } else {
    shakeOffset.x = 0
    shakeOffset.y = 0
  }

  // 1. 处理 P1 输入与物理
  if (keys['w'] || keys['W']) p1.vy -= ACCEL
  if (keys['s'] || keys['S']) p1.vy += ACCEL
  if (keys['a'] || keys['A']) p1.vx -= ACCEL
  if (keys['d'] || keys['D']) p1.vx += ACCEL
  
  // 2. 处理 P2 输入与物理
  if (keys['ArrowUp']) p2.vy -= ACCEL
  if (keys['ArrowDown']) p2.vy += ACCEL
  if (keys['ArrowLeft']) p2.vx -= ACCEL
  if (keys['ArrowRight']) p2.vx += ACCEL

  // 3. 移动端 D-PAD 处理
  if (activeChar.value === 'p1') {
    if (keys['up']) p1.vy -= ACCEL
    if (keys['down']) p1.vy += ACCEL
    if (keys['left']) p1.vx -= ACCEL
    if (keys['right']) p1.vx += ACCEL
  } else {
    if (keys['up']) p2.vy -= ACCEL
    if (keys['down']) p2.vy += ACCEL
    if (keys['left']) p2.vx -= ACCEL
    if (keys['right']) p2.vx += ACCEL
  }

  // 应用摩擦力与限速
  const applyPhysics = (p: any) => {
    p.vx *= FRICTION
    p.vy *= FRICTION
    if (Math.abs(p.vx) > MAX_SPEED) p.vx = Math.sign(p.vx) * MAX_SPEED
    if (Math.abs(p.vy) > MAX_SPEED) p.vy = Math.sign(p.vy) * MAX_SPEED
    if (Math.abs(p.vx) < 0.1) p.vx = 0
    if (Math.abs(p.vy) < 0.1) p.vy = 0

    // 分轴碰撞检测 (实现滑动效果)
    // 1. X 轴
    const nextX = p.x + p.vx
    if (!checkCollision(nextX, p.y)) {
      p.x = nextX
    } else {
      // 碰撞回弹：如果撞了，尝试向反方向推开一点点，防止粘死
      const pushDir = p.vx > 0 ? -1 : 1
      p.vx = 0
      if (!checkCollision(p.x + pushDir, p.y)) p.x += pushDir
    }

    // 2. Y 轴
    const nextY = p.y + p.vy
    if (!checkCollision(p.x, nextY)) {
      p.y = nextY
    } else {
      const pushDir = p.vy > 0 ? -1 : 1
      p.vy = 0
      if (!checkCollision(p.x, p.y + pushDir)) p.y += pushDir
    }

    // 边界限制
    p.x = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_SIZE, p.x))
    p.y = Math.max(0, Math.min(WORLD_HEIGHT - PLAYER_SIZE, p.y))
  }

  applyPhysics(p1)
  applyPhysics(p2)

  // 更新摄像机
  updateCamera()

  // 4. 机关触发检测 (增加感应边距使操作更顺畅)
  switches.value.forEach(sw => {
    const margin = 4
    const p1On = isRectOverlap(p1.x - margin, p1.y - margin, PLAYER_SIZE + margin * 2, PLAYER_SIZE + margin * 2, sw.x, sw.y, sw.w, sw.h)
    const p2On = isRectOverlap(p2.x - margin, p2.y - margin, PLAYER_SIZE + margin * 2, PLAYER_SIZE + margin * 2, sw.x, sw.y, sw.w, sw.h)
    sw.active = p1On || p2On
  })

  // 5. 陷阱检测
  if (checkTraps(p1.x, p1.y) || checkTraps(p2.x, p2.y)) {
    handleDeath()
  }

  // 6. 胜利检测
  const p1AtGoal = isRectOverlap(p1.x, p1.y, PLAYER_SIZE, PLAYER_SIZE, goalPos.x, goalPos.y, 60, 60)
  const p2AtGoal = isRectOverlap(p2.x, p2.y, PLAYER_SIZE, PLAYER_SIZE, goalPos.x, goalPos.y, 60, 60)
  
  if (p1AtGoal && p2AtGoal) {
    nextLevel()
  }
}

// --- 辅助函数 ---

const updateCamera = () => {
  const midX = (p1.x + p2.x + PLAYER_SIZE) / 2
  const midY = (p1.y + p2.y + PLAYER_SIZE) / 2
  
  const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
  // 动态缩放：距离越远缩放越小，最小 0.7，最大 1.2
  const targetScale = Math.max(0.7, Math.min(1.2, 800 / (dist + 400)))
  
  // 平滑过渡
  camera.scale += (targetScale - camera.scale) * 0.1
  camera.x += (midX - camera.x) * 0.1
  camera.y += (midY - camera.y) * 0.1
}

const worldStyle = computed(() => {
  const offsetX = WORLD_WIDTH / 2 - camera.x
  const offsetY = WORLD_HEIGHT / 2 - camera.y
  
  return {
    transform: `
      translate(${shakeOffset.x}px, ${shakeOffset.y}px)
      scale(${camera.scale})
      translate(${offsetX}px, ${offsetY}px)
    `,
    width: `${WORLD_WIDTH}px`,
    height: `${WORLD_HEIGHT}px`
  }
})

const isRectOverlap = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
}

const checkCollision = (x: number, y: number) => {
  // 墙壁检测
  for (const wall of obstacles.value) {
    if (isRectOverlap(x, y, PLAYER_SIZE, PLAYER_SIZE, wall.x, wall.y, wall.w, wall.h)) return true
  }
  // 门检测
  for (const door of doors.value) {
    if (!isDoorOpen(door)) {
      if (isRectOverlap(x, y, PLAYER_SIZE, PLAYER_SIZE, door.x, door.y, door.w, door.h)) return true
    }
  }
  return false
}

const checkTraps = (x: number, y: number) => {
  for (const trap of traps.value) {
    if (isRectOverlap(x + 5, y + 5, PLAYER_SIZE - 10, PLAYER_SIZE - 10, trap.x, trap.y, trap.w, trap.h)) return true
  }
  return false
}

const isDoorOpen = (door: any) => {
  const relatedSwitches = switches.value.filter(sw => sw.targetDoor === door.id)
  if (door.logic === 'and') {
    return relatedSwitches.length > 0 && relatedSwitches.every(sw => sw.active)
  }
  return relatedSwitches.some(sw => sw.active)
}

const handleDeath = () => {
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
  ElMessage.closeAll()
  ElMessage.error({ message: '💔 哪怕是一个人心碎，我们也无法继续前行...', duration: 2000 })
  resetLevel()
}

const resetLevel = () => {
  const config = levels[currentLevel.value - 1]
  if (!config) return
  
  p1.x = config.p1.x
  p1.y = config.p1.y
  p1.vx = p1.vy = 0
  p2.x = config.p2.x
  p2.y = config.p2.y
  p2.vx = p2.vy = 0
  goalPos.x = config.goal.x
  goalPos.y = config.goal.y
  
  obstacles.value = JSON.parse(JSON.stringify(config.obstacles || []))
  switches.value = JSON.parse(JSON.stringify(config.switches || []))
  doors.value = JSON.parse(JSON.stringify(config.doors || []))
  traps.value = JSON.parse(JSON.stringify(config.traps || []))
}

const nextLevel = async () => {
  if (isTransitioning.value) return
  isTransitioning.value = true
  
  if (currentLevel.value >= 15) {
    ElMessage.success('💖 恭喜你们！通过了所有考验，你们的爱无坚不摧！')
    gameStarted.value = false
    isTransitioning.value = false
    return
  }

  // 延迟切换，先显示过场动画
  setTimeout(async () => {
    currentLevel.value++
    await GameSaveService.saveProgress('escape', currentLevel.value)
    resetLevel()
    isTransitioning.value = false
    const levelInfo = levels[currentLevel.value-1]
    if (levelInfo) {
      ElMessage.success(`🎉 进入第 ${currentLevel.value} 关：${levelInfo.name}`)
    }
  }, 1000)
}

const startGame = async (continueSave: boolean) => {
  if (continueSave) {
    currentLevel.value = savedLevel.value
  } else {
    currentLevel.value = 1
    await GameSaveService.resetProgress('escape')
  }
  
  resetLevel()
  gameStarted.value = true
  nextTick(() => {
    animationFrame = requestAnimationFrame(update)
  })
}

const exitGame = () => {
  gameStarted.value = false
  cancelAnimationFrame(animationFrame)
}

const setKey = (key: string, val: boolean) => {
  keys[key] = val
}

// --- 特效辅助函数 ---
const getRandomHeartStyle = () => ({
  left: Math.random() * 100 + '%',
  top: Math.random() * 100 + '%',
  animationDelay: Math.random() * 5 + 's',
  fontSize: (Math.random() * 10 + 10) + 'px',
  opacity: Math.random() * 0.3 + 0.1
})

const getTrailStyle = (p: any, n: number) => {
  const isMoving = Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5
  return {
    opacity: isMoving ? (0.6 / n) : 0,
    transform: `translate(${-p.vx * n * 2}px, ${-p.vy * n * 2}px) scale(${1 - n * 0.2})`,
    transition: 'all 0.1s ease-out'
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  keys[e.key] = true
}

const handleKeyUp = (e: KeyboardEvent) => {
  keys[e.key] = false
}

onMounted(async () => {
  const progress = await GameSaveService.getProgress('escape')
  if (progress) {
    hasSave.value = true
    savedLevel.value = progress.level
  }
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.sweet-escape-game {
  height: 100vh;
  width: 100%;
  background: radial-gradient(circle at center, #0a0a12 0%, #000 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

/* 菜单样式升级 */
.game-menu {
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 50px;
  border-radius: 50px;
  border: 1px solid rgba(255, 77, 121, 0.3);
  box-shadow: 0 0 80px rgba(255, 77, 121, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05);
  max-width: 450px;
  animation: menu-glow 4s infinite alternate;
}

@keyframes menu-glow {
  from { box-shadow: 0 0 40px rgba(255, 77, 121, 0.1); }
  to { box-shadow: 0 0 80px rgba(255, 77, 121, 0.2); }
}

.game-logo { font-size: 80px; margin-bottom: 25px; animation: float 3s infinite ease-in-out; filter: drop-shadow(0 0 20px rgba(255, 77, 121, 0.5)); }
h1 { font-size: 32px; margin-bottom: 20px; background: linear-gradient(45deg, #ff4d79, #ff85a2, #ff4d79); background-size: 200% auto; animation: shine 3s linear infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
@keyframes shine { to { background-position: 200% center; } }
.desc { font-size: 15px; line-height: 1.8; color: #a0a0c0; margin-bottom: 35px; }

/* 舞台样式升级 */
.game-stage {
  width: 900px;
  height: 880px;
  background: radial-gradient(circle at center, #1e1e3f 0%, #0a0a12 100%);
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 0 0 100px rgba(255, 77, 121, 0.2), inset 0 0 50px rgba(0,0,0,0.5);
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  color: white !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  opacity: 0.8;
}

.level-badge { display: flex; align-items: baseline; gap: 20px; }
.level-num { font-size: 16px; color: #ff4d79; font-weight: bold; text-shadow: 0 0 10px rgba(255, 77, 121, 0.5); letter-spacing: 2px; }
.level-name { font-size: 28px; font-weight: bold; color: #fff; text-shadow: 0 0 15px rgba(255, 255, 255, 0.3); }

.game-world {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: #0d0d1a;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  border: 3px solid rgba(255, 77, 121, 0.3);
  box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(255, 77, 121, 0.1);
}

/* 动态特效 */
.world-bg-effects { position: absolute; width: 100%; height: 100%; pointer-events: none; }
.floating-heart { position: absolute; animation: float-up 5s infinite ease-in-out; filter: blur(1px); }
@keyframes float-up {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  50% { opacity: 0.3; }
  100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}

.world-grid {
  position: absolute; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(255, 77, 121, 0.1) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(255, 77, 121, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

.world-scanner {
  position: absolute; width: 100%; height: 100px;
  background: linear-gradient(to bottom, transparent, rgba(255, 77, 121, 0.05), transparent);
  animation: scan 4s infinite linear;
  pointer-events: none;
}
@keyframes scan { from { top: -100px; } to { top: 100%; } }

/* 元素样式升级 */
.world-wall { position: absolute; background: #1a1a2e; overflow: hidden; border-radius: 4px; }
.wall-neon { position: absolute; width: 100%; height: 100%; box-shadow: inset 0 0 15px rgba(255, 77, 121, 0.3); border: 1px solid rgba(255, 77, 121, 0.4); }
.wall-pattern { position: absolute; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px); }

.world-trap { position: absolute; background: rgba(255, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.trap-glow { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, transparent 70%); animation: pulse 2s infinite; }
.trap-border { position: absolute; width: 100%; height: 100%; border: 1px dashed rgba(255, 0, 0, 0.3); }

.world-switch { position: absolute; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.switch-glow { position: absolute; width: 60px; height: 60px; background: radial-gradient(circle, rgba(255, 77, 121, 0.2) 0%, transparent 70%); animation: pulse 1.5s infinite; }
.switch-core { width: 40px; height: 40px; background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 77, 121, 0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; transition: all 0.3s; }
.world-switch.active .switch-core { background: rgba(255, 77, 121, 0.3); transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 77, 121, 0.5); }
.switch-icon { font-size: 20px; }

.world-door { position: absolute; background: rgba(255, 255, 255, 0.05); transition: opacity 0.5s, transform 0.5s; overflow: hidden; border-radius: 4px; }
.door-neon { position: absolute; width: 100%; height: 100%; border: 2px solid #ff4d79; box-shadow: 0 0 15px #ff4d79; }
.world-door.open { opacity: 0.1; transform: scale(0.95); pointer-events: none; }

.world-goal { position: absolute; width: 100px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5; transform: translate(-20px, -20px); }
.goal-effect { position: absolute; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%); animation: rotate 10s infinite linear; }
@keyframes rotate { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.goal-house { font-size: 50px; z-index: 2; filter: drop-shadow(0 0 10px gold); }
.goal-text { font-size: 14px; color: gold; font-weight: bold; margin-top: 5px; text-shadow: 0 0 5px black; }

/* 玩家样式升级 */
.player { position: absolute; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 100; will-change: transform; }
.player-trail { position: absolute; font-size: 12px; pointer-events: none; }
.player-avatar { font-size: 30px; z-index: 2; filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
.player-tag { position: absolute; top: -20px; font-size: 10px; font-weight: bold; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.2); }
.player-glow { position: absolute; width: 50px; height: 50px; background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%); animation: pulse 2s infinite; }

/* 控制器升级 */
.mobile-footer { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.05); padding: 15px 25px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); }
.char-selector { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 15px; }

.dpad-btn {
  width: 55px; height: 55px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px; color: #fff; font-size: 24px; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.dpad-btn:active { background: #ff4d79; border-color: #ff4d79; transform: scale(0.9) translateY(2px); box-shadow: 0 0 20px rgba(255, 77, 121, 0.5); }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } 100% { transform: scale(1); opacity: 0.5; } }

.transition-overlay { position: absolute; inset: 0; background: rgba(10, 10, 18, 0.95); display: flex; align-items: center; justify-content: center; z-index: 200; }
.heart-loader { font-size: 60px; animation: heart-beat 0.8s infinite; filter: drop-shadow(0 0 20px #ff4d79); }
@keyframes heart-beat { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
</style>
