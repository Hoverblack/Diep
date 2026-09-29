const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const titleCanvas = document.getElementById("titleCanvas");
const titleCtx = titleCanvas.getContext("2d");

const FONT = '"Press Start 2P", "Courier New", monospace';

// DOM references
const $ = (id) => document.getElementById(id);
const levelDisplay = $("levelDisplay");
const hpDisplay = $("hpDisplay");
const hpFill = $("hpFill");
const xpText = $("xpText");
const xpFill = $("xpFill");
const bossTimerText = $("bossTimerText");
const bossFill = $("bossFill");
const objectiveLabel = $("objectiveLabel");
const sectorDisplay = $("sectorDisplay");
const livesDisplay = $("livesDisplay");
const scoreDisplay = $("scoreDisplay");
const bestDisplay = $("bestDisplay");
const menuBestDisplay = $("menuBestDisplay");
const upgradePointsDisplay = $("upgradePoints");
const upgradeList = $("upgradeList");
const difficultyLabel = $("difficultyLabel");
const difficultyRange = $("difficultyRange");
const classOverlay = $("classOverlay");
const classOptions = $("classOptions");
const classTierLabel = $("classTierLabel");
const cardOverlay = $("cardOverlay");
const cardOptions = $("cardOptions");
const cardTitle = $("cardTitle");
const pauseButton = $("pauseButton");
const soundButton = $("soundButton");
const menuOverlay = $("menuOverlay");
const gameOverOverlay = $("gameOverOverlay");
const controlsOverlay = $("controlsOverlay");
const startGameButton = $("startGameButton");
const challengeButton = $("challengeButton");
const continueButton = $("continueButton");
const continueLabel = $("continueLabel");
const restartButton = $("restartButton");
const resumeSaveButton = $("resumeSaveButton");
const returnMenuButton = $("returnMenuButton");
const showControlsButton = $("showControlsButton");
const closeControlsButton = $("closeControlsButton");
const menuDifficultyRange = $("menuDifficultyRange");
const menuDifficultyLabel = $("menuDifficultyLabel");
const difficultyModeToggle = $("difficultyModeToggle");
const trackpadModeToggle = $("trackpadModeToggle");
const finalScore = $("finalScore");
const finalSector = $("finalSector");
const finalBest = $("finalBest");
const newRecordLine = $("newRecordLine");

const STORAGE_SAVE = "neonDiep.save.v1";
const STORAGE_BEST = "neonDiep.best.v1";
const STORAGE_SOUND = "neonDiep.muted.v1";

function storageGet(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
        return fallback;
    }
}

function storageSet(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        // stockage indisponible (mode privé) : on continue sans sauvegarde
    }
}

const state = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    upgradePoints: 0,
    difficultyIndex: 2,
    pendingClassTier: null,
    paused: false,
    phase: "menu",
    allowMidgameDifficultyChange: false,
    trackpadMode: false,
    // Secteurs
    sectorIndex: 0,
    sectorKills: 0,
    sectorGoal: 10,
    sectorPhase: "intro", // intro | fight | boss | portal | exit | cards
    phaseTime: 0,
    portal: null,
    // Score / vies
    lives: 3,
    score: 0,
    best: 0,
    combo: 0,
    comboTimer: 0,
    invulnerable: 0,
    // Effets
    shake: 0,
    flash: 0,
    flashColor: "255,43,214",
    time: 0,
};
const upgrades = {
    fireRate: {
        label: "Cadence de tir",
        description: "+8 % de cadence par niveau.",
        maxLevel: 8,
        level: 0,
    },
    multiShot: {
        label: "Multi-shot",
        description: "Ajoute un projectile (max 3 niveaux).",
        maxLevel: 3,
        level: 0,
    },
    xpGain: {
        label: "Maîtrise XP",
        description: "Augmente l'XP gagnée.",
        maxLevel: 10,
        level: 0,
    },
    moveSpeed: {
        label: "Vitesse",
        description: "Augmente la vitesse de déplacement.",
        maxLevel: 8,
        level: 0,
    },
    health: {
        label: "Points de vie",
        description: "Augmente la vie maximale.",
        maxLevel: 8,
        level: 0,
    },
    damage: {
        label: "Dégâts",
        description: "+15 % de dégâts par niveau.",
        maxLevel: 8,
        level: 0,
    },
    resistance: {
        label: "Résistance",
        description: "Réduit les dégâts subis des projectiles ennemis.",
        maxLevel: 6,
        level: 0,
    },
    pierce: {
        label: "Perforation",
        description: "Les projectiles traversent plusieurs cibles.",
        maxLevel: 5,
        level: 0,
    },
    impact: {
        label: "Impact",
        description: "Projectiles plus gros, poussent un peu plus les ennemis.",
        maxLevel: 4,
        level: 0,
    },
    overclock: {
        label: "Overclock",
        description: "Projectiles plus rapides, cadence légèrement accélérée.",
        maxLevel: 4,
        level: 0,
    },
};

// Touches enfoncées, indexées par event.code (ZQSD en AZERTY = KeyW/KeyA/KeyS/KeyD)
const keys = {};

const mouse = {
    x: 0,
    y: 0,
    active: false,
};

const player = {
    x: 0,
    y: 0,
    radius: 22,
    vx: 0,
    vy: 0,
    maxSpeed: 260,
    acceleration: 12, // smoothing factor for reaching target velocity
    drag: 0.08, // keeps a light glide even when inputs stop
    angle: 0,
    baseFireCooldown: 380,
    shotTimer: 0,
    recoil: 0,
    exitScale: 1,
    maxHealth: 100,
    health: 100,
    baseDamage: 20,
    selectedClasses: [],
    pendingClassChoice: false,
};

const difficulties = [
    {
        name: "Jeu d'enfant",
        spawnRate: 0.28,
        spawnAcceleration: 0.012,
        minSpawnInterval: 1050,
        enemyHealthMultiplier: 0.6,
        enemyHealthGrowth: 0.01,
        enemySpeedMultiplier: 0.7,
        enemySpeedGrowth: 0.005,
        baseMaxEnemies: 5,
        maxEnemiesGrowth: 0.01,
    },
    {
        name: "Facile",
        spawnRate: 0.55,
        spawnAcceleration: 0.018,
        minSpawnInterval: 900,
        enemyHealthMultiplier: 0.8,
        enemyHealthGrowth: 0.015,
        enemySpeedMultiplier: 0.85,
        enemySpeedGrowth: 0.008,
        baseMaxEnemies: 7,
        maxEnemiesGrowth: 0.015,
    },
    {
        name: "Moyen",
        spawnRate: 0.88,
        spawnAcceleration: 0.022,
        minSpawnInterval: 780,
        enemyHealthMultiplier: 1,
        enemyHealthGrowth: 0.02,
        enemySpeedMultiplier: 1,
        enemySpeedGrowth: 0.01,
        baseMaxEnemies: 9,
        maxEnemiesGrowth: 0.02,
    },
    {
        name: "Difficile",
        spawnRate: 1.15,
        spawnAcceleration: 0.027,
        minSpawnInterval: 700,
        enemyHealthMultiplier: 1.2,
        enemyHealthGrowth: 0.025,
        enemySpeedMultiplier: 1.1,
        enemySpeedGrowth: 0.015,
        baseMaxEnemies: 11,
        maxEnemiesGrowth: 0.025,
    },
    {
        name: "Hard",
        spawnRate: 1.6,
        spawnAcceleration: 0.035,
        minSpawnInterval: 520,
        enemyHealthMultiplier: 1.6,
        enemyHealthGrowth: 0.03,
        enemySpeedMultiplier: 1.2,
        enemySpeedGrowth: 0.02,
        baseMaxEnemies: 14,
        maxEnemiesGrowth: 0.03,
    },
    {
        name: "Hardcore",
        spawnRate: 2,
        spawnAcceleration: 0.04,
        minSpawnInterval: 450,
        enemyHealthMultiplier: 2,
        enemyHealthGrowth: 0.04,
        enemySpeedMultiplier: 1.3,
        enemySpeedGrowth: 0.025,
        baseMaxEnemies: 18,
        maxEnemiesGrowth: 0.035,
    },
    {
        name: "Impossible",
        spawnRate: 2.5,
        spawnAcceleration: 0.05,
        minSpawnInterval: 380,
        enemyHealthMultiplier: 2.6,
        enemyHealthGrowth: 0.055,
        enemySpeedMultiplier: 1.45,
        enemySpeedGrowth: 0.03,
        baseMaxEnemies: 22,
        maxEnemiesGrowth: 0.04,
    },
    {
        name: "Mais t'es malade ou quoi",
        spawnRate: 3.2,
        spawnAcceleration: 0.07,
        minSpawnInterval: 300,
        enemyHealthMultiplier: 3.2,
        enemyHealthGrowth: 0.08,
        enemySpeedMultiplier: 1.6,
        enemySpeedGrowth: 0.04,
        baseMaxEnemies: 28,
        maxEnemiesGrowth: 0.05,
    },
    {
        name: "Évite (1 PV)",
        spawnRate: 4,
        spawnAcceleration: 0.1,
        minSpawnInterval: 260,
        enemyHealthMultiplier: 3.8,
        enemyHealthGrowth: 0.12,
        enemySpeedMultiplier: 1.85,
        enemySpeedGrowth: 0.05,
        baseMaxEnemies: 32,
        maxEnemiesGrowth: 0.06,
        playerHealthOverride: 1,
    },
];

const projectiles = [];
const enemyProjectiles = [];
const enemies = [];
const pickups = [];
const drones = [];
const mines = [];

let enemySpawnTimer = 0;
const enemySpawnInterval = 900;
let elapsedTime = 0;
let pickupTimer = 0;
const pickupInterval = 9000;
let bossCount = 0;
let overseerMineTimer = 0;

const BASE_PLAYER_STATS = {
    maxSpeed: 260,
    acceleration: 12,
    maxHealth: 100,
};

const playerModifiers = {
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    projectileSpeedMultiplier: 1,
    projectileLifeBonus: 0,
    extraShotCount: 0,
    shotgun: false,
    shotgunPellets: 0,
    shotgunSpread: 0.8,
    shotgunRecoil: 0,
    droneCount: 0,
    droneFireCooldown: 1400,
    droneDamage: 14,
    octoRadial: false,
    cannonBonusShots: 0,
    tankBonusShots: 0,
    projectileSizeBonus: 0,
    overseer: false,
};


const BASE_PROJECTILE_SPEED = 520;
const MAX_DRONES = 4;
// Plafond de projectiles tirés par salve : au-delà, chaque tir en trop
// devient un petit bonus de dégâts au lieu d'un projectile de plus.
const MAX_SHOTS_PER_VOLLEY = 5;
const MAX_SHOTGUN_PELLETS = 7;
const EXCESS_SHOT_DAMAGE = 0.08;
// Filet de sécurité : jamais plus de projectiles joueur à l'écran.
const MAX_PLAYER_PROJECTILES = 50;

// ---------------------------------------------------------------------------
// Sons 8-bit (Web Audio, aucun fichier)
// ---------------------------------------------------------------------------

const sound = {
    ctx: null,
    master: null,
    muted: storageGet(STORAGE_SOUND, false) === true,
    last: {},
};

function ensureAudio() {
    if (sound.ctx) {
        if (sound.ctx.state === "suspended") sound.ctx.resume();
        return sound.ctx;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    sound.ctx = new AudioCtx();
    sound.master = sound.ctx.createGain();
    sound.master.gain.value = sound.muted ? 0 : 0.35;
    sound.master.connect(sound.ctx.destination);
    return sound.ctx;
}

function tone({ freq = 440, to = null, dur = 0.1, type = "square", vol = 0.2, delay = 0 }) {
    const ac = sound.ctx;
    if (!ac || sound.muted) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(sound.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.2, vol = 0.25, delay = 0, filter = 1200 }) {
    const ac = sound.ctx;
    if (!ac || sound.muted) return;
    const t0 = ac.currentTime + delay;
    const length = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(filter, t0);
    lp.frequency.exponentialRampToValueAtTime(80, t0 + dur);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(lp);
    lp.connect(gain);
    gain.connect(sound.master);
    src.start(t0);
}

const SFX = {
    shoot: () => tone({ freq: 880, to: 440, dur: 0.05, vol: 0.035 }),
    hit: () => tone({ freq: 300, to: 180, dur: 0.05, type: "triangle", vol: 0.08 }),
    kill: () => {
        noise({ dur: 0.18, vol: 0.18, filter: 2200 });
        tone({ freq: 520, to: 120, dur: 0.14, vol: 0.08 });
    },
    bossKill: () => {
        noise({ dur: 0.9, vol: 0.4, filter: 1800 });
        [0, 0.12, 0.24].forEach((d, i) => tone({ freq: 220 - i * 50, to: 40, dur: 0.4, vol: 0.2, delay: d }));
    },
    hurt: () => {
        tone({ freq: 160, to: 60, dur: 0.18, type: "sawtooth", vol: 0.18 });
        noise({ dur: 0.1, vol: 0.12 });
    },
    pickup: () => [660, 880, 1320].forEach((f, i) => tone({ freq: f, dur: 0.07, vol: 0.12, delay: i * 0.05 })),
    levelUp: () => [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.1, vol: 0.14, delay: i * 0.07 })),
    boss: () => [0, 0.25, 0.5].forEach((d) => tone({ freq: 110, to: 220, dur: 0.22, type: "sawtooth", vol: 0.18, delay: d })),
    portal: () => tone({ freq: 200, to: 1600, dur: 0.6, type: "triangle", vol: 0.16 }),
    sector: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.12, type: "triangle", vol: 0.14, delay: i * 0.08 })),
    select: () => tone({ freq: 740, to: 1100, dur: 0.08, vol: 0.12 }),
    death: () => {
        noise({ dur: 0.6, vol: 0.35 });
        [440, 330, 220, 110].forEach((f, i) => tone({ freq: f, dur: 0.18, type: "sawtooth", vol: 0.15, delay: i * 0.12 }));
    },
};

// Joue un son en limitant sa fréquence pour ne pas saturer.
function play(name, minGapMs = 0) {
    if (sound.muted || !sound.ctx) return;
    const now = performance.now();
    if (minGapMs && sound.last[name] && now - sound.last[name] < minGapMs) return;
    sound.last[name] = now;
    SFX[name]?.();
}

function toggleMute() {
    sound.muted = !sound.muted;
    storageSet(STORAGE_SOUND, sound.muted);
    if (sound.master) sound.master.gain.value = sound.muted ? 0 : 0.35;
    soundButton.textContent = sound.muted ? "Son : off" : "Son : on";
}

// ---------------------------------------------------------------------------
// Effets visuels : particules, textes flottants, ondes, tremblements, flashs
// ---------------------------------------------------------------------------

const particles = [];
const floatTexts = [];
const rings = [];
const MAX_PARTICLES = 700;

function burst(x, y, color, count = 12, speed = 220, size = 3) {
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.3 + Math.random() * 0.7);
        particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0,
            max: 0.35 + Math.random() * 0.45,
            color,
            size: size * (0.6 + Math.random() * 0.8),
        });
    }
}

function floatText(x, y, text, color = "#ffe45e", size = 10) {
    floatTexts.push({ x, y, text, color, size, life: 0, max: 1.1 });
}

function ring(x, y, color, maxR = 80, dur = 0.45, width = 3) {
    rings.push({ x, y, color, maxR, dur, width, life: 0 });
}

function shake(amount) {
    state.shake = Math.min(24, Math.max(state.shake, amount));
}

function flash(color, amount = 0.35) {
    state.flashColor = color;
    state.flash = Math.max(state.flash, amount);
}

function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
            particles.splice(i, 1);
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 3 * dt;
        p.vy *= 1 - 3 * dt;
    }
    for (let i = floatTexts.length - 1; i >= 0; i -= 1) {
        const t = floatTexts[i];
        t.life += dt;
        t.y -= 40 * dt;
        if (t.life >= t.max) floatTexts.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i -= 1) {
        const r = rings[i];
        r.life += dt;
        if (r.life >= r.dur) rings.splice(i, 1);
    }
    state.shake = Math.max(0, state.shake - dt * 40);
    state.flash = Math.max(0, state.flash - dt * 1.8);
}

function clearEffects() {
    particles.length = 0;
    floatTexts.length = 0;
    rings.length = 0;
    state.shake = 0;
    state.flash = 0;
}

// ---------------------------------------------------------------------------
// Secteurs (niveaux nommés), puis mode infini
// ---------------------------------------------------------------------------

const sectors = [
    { name: "Aube Néon", goal: 18, hue: "#2de2ff", accent: "#ff2bd6" },
    { name: "Grille Cyan", goal: 22, hue: "#2de2ff", accent: "#9b5cff" },
    { name: "Nébuleuse Rose", goal: 26, hue: "#ff5fa2", accent: "#2de2ff" },
    { name: "Tempête Magenta", goal: 30, hue: "#ff2bd6", accent: "#ffe45e" },
    { name: "Cité Chrome", goal: 34, hue: "#9b5cff", accent: "#2de2ff" },
    { name: "Horizon Brisé", goal: 38, hue: "#ffe45e", accent: "#ff2bd6" },
    { name: "Cœur Synthwave", goal: 42, hue: "#ff5fa2", accent: "#9b5cff" },
    { name: "Soleil Noir", goal: 48, hue: "#ff3b6b", accent: "#ffe45e" },
    // Arène secrète : aucun ennemi, seulement le Prisme Noir.
    { name: "Arène Prismatique", goal: 1, hue: "#ffffff", accent: "#ff2bd6", arena: true, boss: "blackprism" },
];

const ARENA_SECTOR = 8;

function getSector(index = state.sectorIndex) {
    if (index < sectors.length) return { ...sectors[index], infinite: false };
    const n = index - sectors.length + 1;
    const palette = sectors[n % sectors.length];
    return {
        name: `Infini ${n}`,
        goal: 48 + n * 5,
        hue: palette.hue,
        accent: palette.accent,
        infinite: true,
    };
}

// Multiplicateurs de menace liés au secteur.
function sectorHealthMult() {
    return 1 + state.sectorIndex * 0.3;
}

function sectorSpeedMult() {
    return Math.min(1.45, 1 + state.sectorIndex * 0.03);
}

function sectorSpawnMult() {
    return 1 + state.sectorIndex * 0.2;
}

// Les ennemis frappent plus fort au fil des secteurs.
function sectorDamageMult() {
    return 1 + state.sectorIndex * 0.12;
}

function getSectorGoal() {
    const base = getSector().goal;
    const diffScale = 0.6 + 0.12 * Math.min(state.difficultyIndex, 6);
    return Math.max(6, Math.round(base * diffScale));
}

// ---------------------------------------------------------------------------
// Améliorations permanentes (cartes entre deux secteurs)
// ---------------------------------------------------------------------------

const perkDefinitions = {
    armor: { icon: "⬢", name: "Blindage", description: "+25 PV max et soin complet.", max: 6 },
    cannon: { icon: "✸", name: "Canon lourd", description: "+12 % de dégâts.", max: 5 },
    trigger: { icon: "⚡", name: "Gâchette", description: "+6 % de cadence.", max: 4 },
    thrusters: { icon: "➤", name: "Réacteurs", description: "+8 % de vitesse de déplacement.", max: 5 },
    magnet: { icon: "◎", name: "Aimant", description: "Attire les bonus de plus loin.", max: 3 },
    regen: { icon: "✚", name: "Nanobots", description: "Régénère 1,5 PV par seconde.", max: 4 },
    extraLife: { icon: "♥", name: "Vie bonus", description: "+1 vie.", max: 9 },
    drone: { icon: "◈", name: "Drone allié", description: "+1 drone qui tire tout seul.", max: 2 },
    piercing: { icon: "➶", name: "Balles perçantes", description: "Les tirs traversent 1 cible de plus.", max: 3 },
    lucky: { icon: "★", name: "Chance", description: "Bonus plus fréquents, plus de drops.", max: 4 },
    combo: { icon: "✦", name: "Frénésie", description: "Combos plus longs (+0,8 s).", max: 4 },
    shield: { icon: "◇", name: "Bouclier", description: "-10 % de dégâts subis.", max: 4 },
};

const perks = {};

function perk(key) {
    return perks[key] || 0;
}

function resetPerks() {
    Object.keys(perks).forEach((key) => delete perks[key]);
}

function rollPerkChoices(count = 3) {
    const pool = Object.keys(perkDefinitions).filter(
        (key) => perk(key) < perkDefinitions[key].max
    );
    const picks = [];
    while (picks.length < count && pool.length > 0) {
        const i = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(i, 1)[0]);
    }
    return picks;
}

function applyPerk(key) {
    perks[key] = perk(key) + 1;
    if (key === "extraLife") state.lives += 1;
    recalcPlayerStats({ refillHealth: key === "armor" });
}

// ---------------------------------------------------------------------------

function resetPlayerModifiers() {
    playerModifiers.damageMultiplier = 1;
    playerModifiers.fireRateMultiplier = 1;
    playerModifiers.projectileSpeedMultiplier = 1;
    playerModifiers.projectileLifeBonus = 0;
    playerModifiers.extraShotCount = 0;
    playerModifiers.shotgun = false;
    playerModifiers.shotgunPellets = 0;
    playerModifiers.shotgunSpread = 0.8;
    playerModifiers.shotgunRecoil = 0;
    playerModifiers.droneCount = 0;
    playerModifiers.droneFireCooldown = 1400;
    playerModifiers.droneDamage = 14;
    playerModifiers.octoRadial = false;
    playerModifiers.cannonBonusShots = 0;
    playerModifiers.tankBonusShots = 0;
    playerModifiers.projectileSizeBonus = 0;
    playerModifiers.overseer = false;
    drones.length = 0;
}

function unlockRandomSkin() {
    const available = playerSkins
        .map((_, index) => index)
        .filter((index) => !unlockedSkinIndexes.has(index));
    if (available.length === 0) {
        const next = (currentSkinIndex + 1) % playerSkins.length;
        currentSkinIndex = next;
        return;
    }
    const choice = available[Math.floor(Math.random() * available.length)];
    unlockedSkinIndexes.add(choice);
    currentSkinIndex = choice;
}

const activeBuffs = {};

const lootTypes = [
    { key: "speed", label: "Vitesse", color: "#5dffa8", duration: 20000 },
    { key: "fireRate", label: "Cadence ++", color: "#ffe45e", duration: 15000 },
    { key: "tripleXP", label: "XP x3", color: "#9b5cff", duration: 10000 },
    { key: "aimbot", label: "Aim-bot", color: "#ff2bd6", duration: 12000 },
    { key: "rareSkin", label: "Skin rare c'est juste ça", color: "#2de2ff", rare: true },
    { key: "heal", label: "Soin", color: "#8cf7ff", heal: 28 },
    { key: "droneAssist", label: "Escouade", color: "#ffb35e", duration: 30000 },
    { key: "upgradeOrb", label: "Orbe de maîtrise", color: "#b4ff5e", minLevel: 25 },
];

const buffLabels = {
    speed: { label: "VITESSE", color: "#5dffa8" },
    fireRate: { label: "CADENCE", color: "#ffe45e" },
    tripleXP: { label: "XP x3", color: "#9b5cff" },
    aimbot: { label: "AIM-BOT", color: "#ff2bd6" },
    droneAssist: { label: "ESCOUADE", color: "#ffb35e" },
};

const playerSkins = [
    { body: "#2de2ff", cannon: "#ff2bd6" },
    { body: "#ff5fa2", cannon: "#ffe45e" },
    { body: "#9b5cff", cannon: "#2de2ff" },
    { body: "#5dffa8", cannon: "#9b5cff" },
    { body: "#ff2bd6", cannon: "#2de2ff" },
    { body: "#ffe45e", cannon: "#ff5fa2" },
    { body: "#7d9bff", cannon: "#ff2bd6" },
    { body: "#ffffff", cannon: "#2de2ff" },
];
let currentSkinIndex = 0;
const unlockedSkinIndexes = new Set([0]);
const completedClassTiers = new Set();

const classTiers = {
    5: ["sniper", "machineGun"],
    10: ["destroyer", "droneController"],
    15: ["shotgun", "octoTank"],
    20: ["overseer"],
};

const classDefinitions = {
    sniper: {
        name: "Sniper",
        description: "Portée accrue, dégâts élevés, cadence réduite.",
        apply() {
            playerModifiers.damageMultiplier *= 1.5;
            playerModifiers.fireRateMultiplier *= 1.25;
            playerModifiers.projectileSpeedMultiplier *= 1.4;
            playerModifiers.projectileLifeBonus += 0.8;
        },
    },
    machineGun: {
        name: "Machine Gun",
        description: "Cadence +, un projectile de plus.",
        apply() {
            playerModifiers.fireRateMultiplier *= 0.8;
            playerModifiers.damageMultiplier *= 0.85;
            playerModifiers.extraShotCount += 1;
        },
    },
    destroyer: {
        name: "Destroyer",
        description: "Projectiles massifs à cadence lente.",
        apply() {
            playerModifiers.damageMultiplier *= 2.5;
            playerModifiers.fireRateMultiplier *= 1.8;
            playerModifiers.projectileSpeedMultiplier *= 0.7;
            playerModifiers.projectileLifeBonus += 0.5;
            playerModifiers.projectileSizeBonus += 4;
        },
    },
    droneController: {
        name: "Drone Controller",
        description: "Déploie des drones autonomes.",
        apply() {
            playerModifiers.droneCount = Math.min(4, playerModifiers.droneCount + 1);
            playerModifiers.droneFireCooldown = 900;
            playerModifiers.droneDamage = 18;
        },
    },
    shotgun: {
        name: "Shotgun",
        description: "Tirs en cône, recul massif.",
        apply() {
            playerModifiers.shotgun = true;
            playerModifiers.shotgunPellets = 6;
            playerModifiers.shotgunSpread = 0.9;
            playerModifiers.shotgunRecoil = 140;
            playerModifiers.fireRateMultiplier *= 0.8;
        },
    },
    octoTank: {
        name: "Octo Tank",
        description: "Tire dans 8 directions en même temps.",
        apply() {
            playerModifiers.octoRadial = true;
            playerModifiers.damageMultiplier *= 1.1;
            playerModifiers.fireRateMultiplier *= 1.1;
            updateTankProgression();
        },
    },
    overseer: {
        name: "Overseer",
        description: "Projectiles traçants et mines auto, triangles puissants.",
        apply() {
            playerModifiers.overseer = true;
            playerModifiers.damageMultiplier *= 1.15;
            playerModifiers.projectileLifeBonus += 0.4;
            playerModifiers.projectileSpeedMultiplier *= 1.05;
        },
    },
};

const enemyArchetypes = [
    {
        name: "Sentinelle",
        shape: "square",
        color: "#49d7ff",
        size: 22,
        health: 35,
        xp: 22,
        speed: 70,
        behavior: "default",
    },
    {
        name: "Esquiveur",
        shape: "triangle",
        color: "#ffbe3c",
        size: 26,
        health: 45,
        xp: 30,
        speed: 120,
        behavior: "dodger",
        agility: 220,
    },
    {
        name: "Bélier",
        minSector: 1,
        shape: "hex",
        color: "#ff6b90",
        size: 30,
        health: 60,
        xp: 40,
        speed: 160,
        behavior: "rusher",
    },
    {
        name: "Guetteur",
        minSector: 1,
        shape: "pentagon",
        color: "#9cf07a",
        size: 26,
        health: 55,
        xp: 36,
        speed: 85,
        behavior: "shooterSingle",
        weightByDifficulty: [0.05, 0.08, 0.12, 0.18, 0.35, 0.6, 0.8, 1],
    },
    {
        name: "Artilleur",
        minSector: 3,
        shape: "diamond",
        color: "#ff9b5e",
        size: 28,
        health: 70,
        xp: 45,
        speed: 95,
        behavior: "shooterDouble",
        weightByDifficulty: [0.02, 0.05, 0.08, 0.12, 0.25, 0.6, 0.9, 1.2],
    },
    {
        name: "Barrageur",
        minSector: 5,
        shape: "octagon",
        color: "#b59cff",
        size: 30,
        health: 90,
        xp: 55,
        speed: 90,
        behavior: "shooterSix",
        weightByDifficulty: [0, 0.01, 0.02, 0.04, 0.15, 0.5, 0.9, 1.1],
    },
    {
        name: "Faucheur",
        minSector: 2,
        shape: "triangle",
        color: "#ff78c9",
        size: 24,
        health: 65,
        xp: 52,
        speed: 190,
        behavior: "rusher",
        weightByDifficulty: [0.05, 0.08, 0.12, 0.18, 0.25, 0.8, 1.2, 1.3],
    },
    {
        name: "Obélisque",
        minSector: 4,
        shape: "hex",
        color: "#7dffec",
        size: 32,
        health: 110,
        xp: 78,
        speed: 82,
        behavior: "shooterDouble",
        weightByDifficulty: [0.02, 0.05, 0.08, 0.12, 0.18, 0.7, 1.1, 1.2],
    },
    // Mobs lasers : mini-Prismes
    {
        name: "Lentille",
        minSector: 3,
        shape: "diamond",
        color: "#ffe45e",
        size: 22,
        health: 60,
        xp: 50,
        speed: 80,
        behavior: "laserMob",
        beamCount: 1,
        weightByDifficulty: [0.12, 0.2, 0.35, 0.45, 0.55, 0.7, 0.8, 0.9],
    },
    {
        name: "Kaléido",
        minSector: 5,
        shape: "octagon",
        color: "#ffb35e",
        size: 26,
        health: 95,
        xp: 75,
        speed: 70,
        behavior: "laserMob",
        beamCount: 3,
        weightByDifficulty: [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    },
];

const MAX_LASER_MOBS = 3;

let waveIndex = 0;
let specialWaveType = null;
let specialWaveTimeLeft = 0;

const bossConfigs = [
    {
        id: "juggernaut",
        name: "Titan",
        shape: "hex",
        color: "#8ef0ff",
        size: 60,
        health: 820,
        xp: 200,
        speed: 60,
        behavior: "bossTank",
    },
    {
        id: "phantom",
        name: "Spectre",
        shape: "circle",
        color: "#ffa94d",
        size: 45,
        health: 580,
        xp: 180,
        speed: 190,
        behavior: "bossDrone",
    },
    {
        id: "spiral",
        name: "Cyclone",
        shape: "octagon",
        color: "#d77bff",
        size: 55,
        health: 660,
        xp: 220,
        speed: 90,
        behavior: "bossSpiral",
    },
    {
        id: "hydra",
        name: "Hydre",
        shape: "pentagon",
        color: "#5dffa8",
        size: 52,
        health: 760,
        xp: 240,
        speed: 120,
        behavior: "bossHydra",
    },
    {
        id: "prism",
        name: "Prisme",
        shape: "diamond",
        color: "#ffe45e",
        size: 54,
        health: 800,
        xp: 260,
        speed: 70,
        behavior: "bossPrism",
    },
    {
        id: "queen",
        name: "Reine Essaim",
        shape: "triangle",
        color: "#ff2bd6",
        size: 50,
        health: 740,
        xp: 280,
        speed: 110,
        behavior: "bossQueen",
    },
    {
        id: "bastion",
        name: "Bastion",
        shape: "square",
        color: "#7d9bff",
        size: 56,
        health: 900,
        xp: 300,
        speed: 65,
        behavior: "bossBastion",
        hpMult: 0.6, // son bouclier bloque une bonne partie des tirs
    },
    {
        id: "omega",
        name: "Oméga",
        shape: "octagon",
        color: "#ff3b6b",
        size: 68,
        health: 1100,
        xp: 400,
        speed: 75,
        behavior: "bossOmega",
        hpMult: 1.2, // boss final
    },
    {
        id: "blackprism",
        name: "Prisme Noir",
        shape: "diamond",
        color: "#ffffff",
        size: 66,
        health: 1300,
        xp: 700,
        speed: 90,
        behavior: "bossBlackPrism",
        hpMult: 1.15,
        rainbow: true,
        arenaOnly: true,
        beamFactor: 0.65, // beaucoup de lasers : chacun brûle un peu moins
    },
];

function pickBossConfig() {
    const sector = getSector();
    if (sector.boss) return bossConfigs.find((b) => b.id === sector.boss);
    const regular = bossConfigs.filter((b) => !b.arenaOnly);
    return regular[state.sectorIndex % regular.length];
}

function getArchetypeWeight(type, difficultyIndex) {
    if (type.weightByDifficulty && type.weightByDifficulty.length) {
        const clampedIndex = Math.min(
            type.weightByDifficulty.length - 1,
            Math.max(0, difficultyIndex)
        );
        let weight = type.weightByDifficulty[clampedIndex] ?? 0;
        const shooterBehaviors = ["shooterSingle", "shooterDouble", "shooterSix"];
        if (shooterBehaviors.includes(type.behavior)) {
            let damp = 1;
            if (difficultyIndex <= 1) {
                damp = 0.08; // quasi nul en Jeu d'enfant / Facile
            } else if (difficultyIndex === 2) {
                damp = 0.14; // rare en Moyen au début
            } else if (difficultyIndex === 3) {
                damp = 0.4; // réduit en Difficile
            }
            // Les tireurs deviennent courants dans les derniers secteurs
            // (avant, en Moyen, on n'en voyait presque jamais).
            const lateGame = Math.min(1, state.sectorIndex / 6) * (difficultyIndex <= 1 ? 0.3 : 0.6);
            weight = weight * (damp + (1 - damp) * lateGame) + lateGame * 0.5;
        }
        return weight;
    }
    return type.weight ?? 1;
}

function pickWeightedEnemyType(pool, difficultyIndex) {
    const weighted = pool
        .map((type) => ({
            type,
            weight: getArchetypeWeight(type, difficultyIndex),
        }))
        .filter((entry) => entry.weight > 0);

    if (weighted.length === 0) {
        return pool[Math.floor(Math.random() * pool.length)];
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of weighted) {
        roll -= entry.weight;
        if (roll <= 0) return entry.type;
    }
    return weighted[weighted.length - 1].type;
}

function getDifficultyConfig() {
    return difficulties[state.difficultyIndex] || difficulties[2];
}

// Fond de l'arène pré-rendu (redessiné seulement au redimensionnement).
let arenaBackground = null;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width || canvas.parentElement.clientWidth || 800);
    const height = Math.round(rect.height || 500);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    arenaBackground = null;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function resizeTitleCanvas() {
    titleCanvas.width = window.innerWidth;
    titleCanvas.height = window.innerHeight;
}

// Ensure proper initial sizing after layout
setTimeout(() => {
    resizeCanvas();
    resizeTitleCanvas();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    mouse.x = player.x;
    mouse.y = player.y + 1;
    state.best = Number(storageGet(STORAGE_BEST, 0)) || 0;
    resetRunState();
    state.paused = true;
    trackpadModeToggle.checked = state.trackpadMode;
    soundButton.textContent = sound.muted ? "Son : off" : "Son : on";
    refreshDifficultyModeButtons();
    updateDifficultyDisplay();
    refreshMenu();
    updateHUD();
    showOverlay(menuOverlay);
}, 0);

window.addEventListener("resize", () => {
    resizeCanvas();
    resizeTitleCanvas();
});

// ---------------------------------------------------------------------------
// Entrées clavier / souris
// ---------------------------------------------------------------------------

const UPGRADE_HOTKEYS = [
    "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
    "Digit6", "Digit7", "Digit8", "Digit9", "Digit0",
];

function isOverlayVisible(overlay) {
    return !overlay.classList.contains("hidden");
}

window.addEventListener("keydown", (event) => {
    ensureAudio();
    const code = event.code;
    const key = event.key.toLowerCase();

    if (key === "m" && !event.repeat) {
        toggleMute();
        return;
    }

    if (isOverlayVisible(controlsOverlay)) {
        if (code === "Escape" || code === "Enter") {
            hideOverlay(controlsOverlay);
            event.preventDefault();
        }
        return;
    }

    if (state.phase === "menu") {
        if (code === "Enter" || code === "NumpadEnter") {
            event.preventDefault();
            if (storageGet(STORAGE_SAVE)) continueFromSave();
            else startNewGame();
        } else if (key === "n") {
            event.preventDefault();
            startNewGame();
        }
        return;
    }

    if (state.phase === "gameover") {
        if (code === "Enter" || code === "NumpadEnter") {
            event.preventDefault();
            if (storageGet(STORAGE_SAVE)) continueFromSave();
            else startNewGame();
        } else if (key === "n") {
            event.preventDefault();
            startNewGame();
        } else if (code === "Escape") {
            returnToMenu();
        }
        return;
    }

    // Choix de carte entre deux secteurs
    if (state.sectorPhase === "cards" && isOverlayVisible(cardOverlay)) {
        const index = ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].indexOf(code) % 3;
        if (index >= 0) {
            const buttons = cardOptions.querySelectorAll("button");
            buttons[index]?.click();
            event.preventDefault();
        }
        return;
    }

    // Choix de classe
    if (player.pendingClassChoice) {
        const index = ["Digit1", "Digit2", "Digit3"].indexOf(code);
        if (index >= 0) {
            classOptions.querySelectorAll("button")[index]?.click();
            event.preventDefault();
        }
        return;
    }

    if (code === "Space" || code === "Escape" || key === "p") {
        event.preventDefault();
        if (!event.repeat) togglePause();
        return;
    }

    const upgradeIndex = UPGRADE_HOTKEYS.indexOf(code);
    if (upgradeIndex >= 0 && !state.paused) {
        const upgradeKey = Object.keys(upgrades)[upgradeIndex];
        if (upgradeKey) spendUpgradePoint(upgradeKey);
        event.preventDefault();
        return;
    }

    keys[code] = true;
    if (code.startsWith("Arrow")) event.preventDefault();
});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
    if (event.code === "Space" && state.phase === "playing") {
        event.preventDefault();
    }
});

window.addEventListener("blur", () => {
    Object.keys(keys).forEach((code) => (keys[code] = false));
    if (state.phase === "playing" && !state.paused) togglePause();
});

window.addEventListener("pointerdown", ensureAudio);

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    mouse.active = true;
});

// Évite qu'un bouton garde le focus (sinon Espace le re-cliquerait).
document.addEventListener("click", (event) => {
    if (event.target.closest("button")) event.target.closest("button").blur();
});

difficultyRange.addEventListener("input", (event) => {
    const index = Number(event.target.value);
    if (Number.isNaN(index)) return;
    if (state.phase === "playing" && !state.allowMidgameDifficultyChange) {
        difficultyRange.value = state.difficultyIndex;
        return;
    }
    setDifficulty(index, { midRun: state.phase === "playing" });
    updateHUD();
});

pauseButton.addEventListener("click", () => togglePause());
soundButton.addEventListener("click", () => {
    ensureAudio();
    toggleMute();
});

menuDifficultyRange.addEventListener("input", (event) => {
    const index = Number(event.target.value);
    if (Number.isNaN(index)) return;
    setDifficulty(index);
    updateHUD();
});

difficultyModeToggle.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    const mode = btn.dataset.mode;
    state.allowMidgameDifficultyChange = mode === "flex";
    refreshDifficultyModeButtons();
    updateDifficultyLockState();
});

trackpadModeToggle.addEventListener("change", (event) => {
    state.trackpadMode = event.target.checked;
});

startGameButton.addEventListener("click", () => startNewGame());
continueButton.addEventListener("click", () => continueFromSave());
restartButton.addEventListener("click", () => (state.challenge ? startChallenge() : startNewGame()));
challengeButton.addEventListener("click", () => startChallenge());
resumeSaveButton.addEventListener("click", () => continueFromSave());
returnMenuButton.addEventListener("click", () => returnToMenu());
showControlsButton.addEventListener("click", () => showOverlay(controlsOverlay));
closeControlsButton.addEventListener("click", () => hideOverlay(controlsOverlay));

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

const hudCache = {};

function setText(el, value) {
    if (hudCache[el.id] === value) return;
    hudCache[el.id] = value;
    el.textContent = value;
}

function setWidth(el, ratio) {
    const value = `${Math.round(Math.max(0, Math.min(1, ratio)) * 1000) / 10}%`;
    if (hudCache[`${el.id}-w`] === value) return;
    hudCache[`${el.id}-w`] = value;
    el.style.width = value;
}

function formatScore(value) {
    return Math.floor(value).toLocaleString("fr-FR");
}

function updateHUD() {
    setText(levelDisplay, String(state.level));
    setText(hpDisplay, `${Math.ceil(player.health)} / ${player.maxHealth}`);
    setWidth(hpFill, player.health / player.maxHealth);
    setText(xpText, `${Math.floor(state.xp)} / ${state.xpToNext}`);
    setWidth(xpFill, state.xp / state.xpToNext);
    setText(upgradePointsDisplay, String(state.upgradePoints));
    const sector = getSector();
    setText(sectorDisplay, sector.infinite ? `∞${state.sectorIndex - sectors.length + 1}` : String(state.sectorIndex + 1));
    setText(livesDisplay, state.lives > 5 ? `♥x${state.lives}` : "♥".repeat(Math.max(0, state.lives)) || "-");
    setText(scoreDisplay, formatScore(state.score));
    setText(bestDisplay, formatScore(Math.max(state.best, state.score)));

    const boss = enemies.find((e) => e.isBoss);
    if (state.sectorPhase === "boss" && boss) {
        setText(objectiveLabel, boss.name);
        setText(bossTimerText, `${Math.ceil(boss.currentHealth)} PV`);
        setWidth(bossFill, boss.currentHealth / boss.health);
        bossFill.classList.add("full");
    } else if (state.sectorPhase === "portal" || state.sectorPhase === "exit") {
        setText(objectiveLabel, "Portail");
        setText(bossTimerText, "Ouvert !");
        setWidth(bossFill, 1);
        bossFill.classList.add("full");
    } else if (getSector().arena) {
        setText(objectiveLabel, "Arène");
        setText(bossTimerText, "Il arrive…");
        setWidth(bossFill, Math.min(1, state.phaseTime / ARENA_INTRO));
        bossFill.classList.remove("full");
    } else {
        setText(objectiveLabel, "Objectif");
        setText(bossTimerText, `${state.sectorKills} / ${state.sectorGoal}`);
        setWidth(bossFill, state.sectorKills / state.sectorGoal);
        bossFill.classList.remove("full");
    }
    updateUpgradeButtonStates();
}

function updateDifficultyDisplay() {
    syncDifficultyInputs();
    updateDifficultyLockState();
}

function updateUpgradeButtonStates() {
    const buttons = upgradeList.querySelectorAll("button");
    buttons.forEach((btn) => {
        const key = btn.dataset.upgrade;
        const upgrade = upgrades[key];
        if (!upgrade) return;
        const disabled = upgrade.level >= upgrade.maxLevel || state.upgradePoints <= 0;
        if (btn.disabled !== disabled) {
            btn.disabled = disabled;
            btn.closest(".upgrade-card").classList.toggle("can-buy", !disabled);
        }
    });
}

function togglePause() {
    if (state.phase !== "playing") return;
    state.paused = !state.paused;
    pauseButton.textContent = state.paused ? "Reprendre" : "Pause";
}

function getSpawnInterval() {
    const diff = getDifficultyConfig();
    const scaling = 1 + elapsedTime * diff.spawnAcceleration;
    const rate = diff.spawnRate * scaling * sectorSpawnMult();
    const interval = enemySpawnInterval / Math.max(0.1, rate);
    const bossSlowdown = state.sectorPhase === "boss" ? 1.8 : 1;
    return Math.max(diff.minSpawnInterval, interval) * bossSlowdown;
}

function getMaxEnemies() {
    const diff = getDifficultyConfig();
    const dynamic =
        diff.baseMaxEnemies +
        Math.floor(elapsedTime * diff.maxEnemiesGrowth) +
        Math.floor(state.sectorIndex * 0.8);
    return Math.max(diff.baseMaxEnemies, dynamic);
}

function setDifficulty(index, { midRun = false } = {}) {
    const clamped = Math.min(difficulties.length - 1, Math.max(0, index));
    state.difficultyIndex = clamped;
    updateDifficultyDisplay();
    if (midRun) {
        // En cours de partie : on garde les ennemis et la vie actuelle
        // (avant, changer de difficulté remettait la vie au max).
        const health = player.health;
        recalcPlayerStats();
        player.health = Math.min(health, player.maxHealth);
        state.sectorGoal = Math.max(state.sectorKills, getSectorGoal());
        return;
    }
    elapsedTime = 0;
    enemySpawnTimer = 0;
    pickupTimer = 0;
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    pickups.length = 0;
    recalcPlayerStats({ refillHealth: true });
    state.sectorGoal = getSectorGoal();
}

function syncDifficultyInputs() {
    difficultyLabel.textContent = getDifficultyConfig().name;
    difficultyRange.value = state.difficultyIndex;
    menuDifficultyRange.value = state.difficultyIndex;
    menuDifficultyLabel.textContent = getDifficultyConfig().name;
}

function updateDifficultyLockState() {
    const locked = state.phase === "playing" && !state.allowMidgameDifficultyChange;
    difficultyRange.disabled = locked;
}

function refreshDifficultyModeButtons() {
    if (!difficultyModeToggle) return;
    const buttons = difficultyModeToggle.querySelectorAll("button");
    buttons.forEach((btn) => {
        const mode = btn.dataset.mode;
        const shouldBeActive =
            (!state.allowMidgameDifficultyChange && mode === "locked") ||
            (state.allowMidgameDifficultyChange && mode === "flex");
        btn.classList.toggle("active", shouldBeActive);
    });
}

// Les timers de masquage sont mémorisés pour qu'un overlay ré-affiché
// juste après avoir été masqué ne disparaisse pas.
const overlayTimers = new WeakMap();

function showOverlay(overlay) {
    if (!overlay) return;
    clearTimeout(overlayTimers.get(overlay));
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("visible"));
}

function hideOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("visible");
    clearTimeout(overlayTimers.get(overlay));
    overlayTimers.set(
        overlay,
        setTimeout(() => overlay.classList.add("hidden"), 200)
    );
}

// ---------------------------------------------------------------------------
// Déroulement d'une partie
// ---------------------------------------------------------------------------

function resetRunState() {
    state.xp = 0;
    state.level = 1;
    state.upgradePoints = 0;
    state.xpToNext = 100;
    state.lives = 3;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.invulnerable = 0;
    state.sectorIndex = 0;
    Object.values(upgrades).forEach((u) => (u.level = 0));
    resetPerks();
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    pickups.length = 0;
    drones.length = 0;
    mines.length = 0;
    clearEffects();
    waveIndex = 0;
    specialWaveType = null;
    specialWaveTimeLeft = 0;
    bossCount = 0;
    for (const key of Object.keys(activeBuffs)) {
        delete activeBuffs[key];
    }
    elapsedTime = 0;
    overseerMineTimer = 0;
    pickupTimer = 0;
    enemySpawnTimer = 0;
    completedClassTiers.clear();
    player.selectedClasses = [];
    player.pendingClassChoice = false;
    player.vx = 0;
    player.vy = 0;
    state.pendingClassTier = null;
    hideClassOverlay();
    hideOverlay(cardOverlay);
    resetPlayerModifiers();
    currentSkinIndex = 0;
    recalcPlayerStats({ refillHealth: true });
    refreshUpgradePanel();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    beginSector(0, { save: false });
}

function enterPlaying() {
    ensureAudio();
    state.phase = "playing";
    state.paused = false;
    pauseButton.textContent = "Pause";
    hideOverlay(menuOverlay);
    hideOverlay(gameOverOverlay);
    hideOverlay(controlsOverlay);
    updateDifficultyLockState();
}

// Défi : directement l'arène du Prisme Noir avec un tank de niveau 20.
function startChallenge() {
    setDifficulty(Number(menuDifficultyRange.value));
    state.trackpadMode = trackpadModeToggle.checked;
    resetRunState();
    state.challenge = true;
    state.level = 20;
    state.upgradePoints = 20;
    enterPlaying();
    beginSector(ARENA_SECTOR, { save: false });
    refreshUpgradePanel();
    checkClassMilestones();
}

function startNewGame() {
    state.challenge = false;
    setDifficulty(Number(menuDifficultyRange.value));
    state.trackpadMode = trackpadModeToggle.checked;
    storageSet(STORAGE_SAVE, null);
    resetRunState();
    enterPlaying();
    beginSector(0);
}

function returnToMenu() {
    state.phase = "menu";
    state.paused = true;
    syncDifficultyInputs();
    trackpadModeToggle.checked = state.trackpadMode;
    refreshDifficultyModeButtons();
    refreshMenu();
    hideClassOverlay();
    hideOverlay(cardOverlay);
    showOverlay(menuOverlay);
    hideOverlay(gameOverOverlay);
    updateDifficultyLockState();
}

function refreshMenu() {
    const save = storageGet(STORAGE_SAVE);
    menuBestDisplay.textContent = formatScore(state.best);
    if (save) {
        continueButton.classList.remove("hidden");
        const name = getSectorNameFor(save.sectorIndex);
        continueLabel.textContent = `· S${save.sectorIndex + 1} ${name}`;
    } else {
        continueButton.classList.add("hidden");
    }
}

function getSectorNameFor(index) {
    return getSector(index).name;
}

function beginSector(index, { save = true } = {}) {
    state.sectorIndex = index;
    state.sectorKills = 0;
    state.sectorGoal = getSectorGoal();
    state.sectorPhase = "intro";
    state.phaseTime = 0;
    state.portal = null;
    player.exitScale = 1;
    elapsedTime = 0;
    enemySpawnTimer = 0;
    enemies.length = 0;
    enemyProjectiles.length = 0;
    mines.length = 0;
    arenaBackground = null;
    if (getSector().arena) {
        player.x = canvas.width / 2;
        player.y = canvas.height * 0.78;
    }
    if (save && !state.challenge) saveProgress();
    if (state.phase === "playing") play("sector");
}

// Sauvegarde automatique au début de chaque secteur.
function saveProgress() {
    if (state.challenge) return;
    storageSet(STORAGE_SAVE, {
        difficultyIndex: state.difficultyIndex,
        allowMidgameDifficultyChange: state.allowMidgameDifficultyChange,
        trackpadMode: state.trackpadMode,
        sectorIndex: state.sectorIndex,
        level: state.level,
        xp: state.xp,
        xpToNext: state.xpToNext,
        upgradePoints: state.upgradePoints,
        lives: Math.max(1, state.lives),
        score: state.score,
        upgrades: Object.fromEntries(Object.entries(upgrades).map(([k, u]) => [k, u.level])),
        perks: { ...perks },
        classes: [...player.selectedClasses],
        classTiers: [...completedClassTiers],
        skin: currentSkinIndex,
        skins: [...unlockedSkinIndexes],
    });
}

function continueFromSave() {
    state.challenge = false;
    const save = storageGet(STORAGE_SAVE);
    if (!save) {
        startNewGame();
        return;
    }
    state.allowMidgameDifficultyChange = !!save.allowMidgameDifficultyChange;
    state.trackpadMode = !!save.trackpadMode;
    refreshDifficultyModeButtons();
    setDifficulty(save.difficultyIndex ?? 2);
    resetRunState();
    state.level = save.level || 1;
    state.xp = save.xp || 0;
    state.xpToNext = save.xpToNext || 100;
    state.upgradePoints = save.upgradePoints || 0;
    state.lives = save.lives || 3;
    state.score = save.score || 0;
    Object.entries(save.upgrades || {}).forEach(([key, level]) => {
        if (!upgrades[key]) return;
        upgrades[key].level = Math.min(upgrades[key].maxLevel, level);
        // Niveaux au-delà d'un nouveau plafond : points rendus au joueur.
        state.upgradePoints += Math.max(0, level - upgrades[key].maxLevel);
    });
    Object.assign(perks, save.perks || {});
    Object.keys(perks).forEach((key) => {
        const max = perkDefinitions[key]?.max;
        if (max !== undefined) perks[key] = Math.min(max, perks[key]);
    });
    (save.classes || []).forEach((id) => {
        if (!classDefinitions[id]) return;
        classDefinitions[id].apply();
        player.selectedClasses.push(id);
    });
    (save.classTiers || []).forEach((tier) => completedClassTiers.add(tier));
    (save.skins || []).forEach((skin) => unlockedSkinIndexes.add(skin));
    currentSkinIndex = playerSkins[save.skin] ? save.skin : 0;
    updateSniperCannonProgression();
    updateTankProgression();
    recalcPlayerStats({ refillHealth: true });
    refreshUpgradePanel();
    enterPlaying();
    beginSector(save.sectorIndex || 0);
    checkClassMilestones();
}

function recordBest() {
    const isRecord = state.score > state.best;
    if (isRecord) {
        state.best = Math.floor(state.score);
        storageSet(STORAGE_BEST, state.best);
    }
    return isRecord;
}

function handlePlayerDeath() {
    if (state.phase !== "playing" || state.invulnerable > 0) return;
    state.lives -= 1;
    state.combo = 0;
    burst(player.x, player.y, playerSkins[currentSkinIndex].body, 60, 420, 4);
    ring(player.x, player.y, "#ff3b6b", 260, 0.7, 5);
    shake(22);
    flash("255,59,107", 0.6);

    if (state.lives > 0) {
        play("hurt");
        // Réapparition : vie pleine, invulnérabilité et onde de choc
        recalcPlayerStats({ refillHealth: true });
        state.invulnerable = 2.5;
        enemyProjectiles.length = 0;
        enemies.forEach((enemy) => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 300) {
                const push = (300 - dist) * (enemy.isBoss ? 0.4 : 1);
                enemy.x += (dx / dist) * push;
                enemy.y += (dy / dist) * push;
            }
        });
        floatText(player.x, player.y - 40, "VIE PERDUE", "#ff3b6b", 12);
        return;
    }

    play("death");
    state.phase = "gameover";
    state.paused = true;
    pauseButton.textContent = "Reprendre";
    const isRecord = recordBest();
    finalScore.textContent = formatScore(state.score);
    finalSector.textContent = getSector().name;
    finalBest.textContent = formatScore(state.best);
    newRecordLine.classList.toggle("hidden", !isRecord);
    resumeSaveButton.classList.toggle("hidden", state.challenge || !storageGet(STORAGE_SAVE));
    hideClassOverlay();
    setTimeout(() => showOverlay(gameOverOverlay), 700);
}

function showClassOverlay(level) {
    const tierIds = classTiers[level];
    if (!tierIds) return;
    state.pendingClassTier = level;
    classOptions.innerHTML = "";
    classTierLabel.textContent = `Niveau ${level} atteint`;

    tierIds.forEach((id, index) => {
        const def = classDefinitions[id];
        if (!def) return;
        const card = document.createElement("div");
        card.className = "class-card";
        card.innerHTML = `
            <h4>${def.name}</h4>
            <p>${def.description}</p>
        `;
        const button = document.createElement("button");
        button.textContent = `Choisir (${index + 1})`;
        button.addEventListener("click", () => chooseClass(id, level));
        card.appendChild(button);
        classOptions.appendChild(card);
    });

    showOverlay(classOverlay);
}

function hideClassOverlay() {
    hideOverlay(classOverlay);
}

function chooseClass(id, level) {
    const def = classDefinitions[id];
    if (!def || state.pendingClassTier !== level) return;
    def.apply();
    player.selectedClasses.push(id);
    updateSniperCannonProgression();
    updateTankProgression();
    completedClassTiers.add(level);
    state.pendingClassTier = null;
    player.pendingClassChoice = false;
    hideClassOverlay();
    play("select");
    ring(player.x, player.y, "#ffe45e", 140, 0.6, 4);
    floatText(player.x, player.y - 46, def.name.toUpperCase(), "#ffe45e", 12);
    // Si plusieurs paliers ont été franchis d'un coup, on enchaîne.
    checkClassMilestones();
}

function showCardOverlay() {
    const choices = rollPerkChoices(3);
    const sector = getSector();
    cardTitle.textContent = `${sector.name} : terminé !`;
    cardOptions.innerHTML = "";
    if (choices.length === 0) {
        nextSector();
        return;
    }
    choices.forEach((key, index) => {
        const def = perkDefinitions[key];
        const card = document.createElement("div");
        card.className = "class-card";
        card.innerHTML = `
            <div class="card-icon">${def.icon}</div>
            <h4>${def.name}</h4>
            <p>${def.description}${perk(key) ? ` (niv. ${perk(key)} → ${perk(key) + 1})` : ""}</p>
        `;
        const button = document.createElement("button");
        button.textContent = `Prendre (${index + 1})`;
        button.addEventListener("click", () => {
            if (state.sectorPhase !== "cards") return;
            applyPerk(key);
            play("select");
            hideOverlay(cardOverlay);
            nextSector();
        });
        card.appendChild(button);
        cardOptions.appendChild(card);
    });
    showOverlay(cardOverlay);
}

function nextSector() {
    beginSector(state.sectorIndex + 1);
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.exitScale = 1;
    pickups.length = 0;
    projectiles.length = 0;
}

// ---------------------------------------------------------------------------
// Améliorations (points de niveau)
// ---------------------------------------------------------------------------

function initUpgradePanel() {
    upgradeList.innerHTML = "";

    Object.entries(upgrades).forEach(([key, config], index) => {
        const card = document.createElement("div");
        card.className = "upgrade-card";
        const hotkey = index === 9 ? "0" : String(index + 1);

        card.innerHTML = `
            <header>
                <h3><span class="hotkey">[${hotkey}]</span>${config.label}</h3>
                <button data-upgrade="${key}" title="Améliorer (${hotkey})">+</button>
            </header>
            <p>${config.description}</p>
            <div class="progress-dots">
                ${Array.from({ length: config.maxLevel })
                    .map(
                        (_, i) =>
                            `<span class="dot ${
                                i < config.level ? "filled" : ""
                            }"></span>`
                    )
                    .join("")}
            </div>
        `;

        const button = card.querySelector("button");
        button.addEventListener("click", () => spendUpgradePoint(key));
        const disabled = config.level >= config.maxLevel || state.upgradePoints <= 0;
        button.disabled = disabled;
        card.classList.toggle("can-buy", !disabled);
        upgradeList.appendChild(card);
    });
}

function refreshUpgradePanel() {
    initUpgradePanel();
}

function spendUpgradePoint(key) {
    const upgrade = upgrades[key];
    if (!upgrade || upgrade.level >= upgrade.maxLevel || state.upgradePoints <= 0) {
        return;
    }
    upgrade.level += 1;
    state.upgradePoints -= 1;
    applyUpgradeEffect(key);
    refreshUpgradePanel();
    updateHUD();
    play("select");
    if (state.phase === "playing") {
        floatText(player.x, player.y - 40, `${upgrade.label} +1`, "#2de2ff", 9);
    }
}

function applyUpgradeEffect(key) {
    if (key === "moveSpeed" || key === "health") {
        recalcPlayerStats({ refillHealth: false });
        if (key === "health") player.health = Math.min(player.maxHealth, player.health + 20);
    }
}

function recalcPlayerStats({ refillHealth = false } = {}) {
    player.maxSpeed =
        (BASE_PLAYER_STATS.maxSpeed + upgrades.moveSpeed.level * 30) *
        (1 + perk("thrusters") * 0.08);
    player.acceleration =
        BASE_PLAYER_STATS.acceleration + upgrades.moveSpeed.level * 0.8;

    const prevMaxHealth = player.maxHealth || BASE_PLAYER_STATS.maxHealth;
    const ratio = prevMaxHealth ? player.health / prevMaxHealth : 1;
    const override = getDifficultyConfig().playerHealthOverride;
    const newMaxHealth =
        override ||
        BASE_PLAYER_STATS.maxHealth + upgrades.health.level * 20 + perk("armor") * 25;
    player.maxHealth = newMaxHealth;
    player.health = refillHealth
        ? newMaxHealth
        : Math.min(newMaxHealth, ratio * newMaxHealth);
}

// Cadence : les bonus s'additionnent (avant ils se multipliaient et tout
// le monde atteignait le plancher dès le milieu de partie).
const MIN_FIRE_COOLDOWN = 150;

function getFireRateBonus() {
    return (
        1 +
        upgrades.fireRate.level * 0.08 +
        upgrades.overclock.level * 0.05 +
        perk("trigger") * 0.06
    );
}

function getFireCooldown() {
    const buff = isBuffActive("fireRate") ? 1.4 : 1;
    return Math.max(
        MIN_FIRE_COOLDOWN,
        (player.baseFireCooldown * playerModifiers.fireRateMultiplier) /
            (getFireRateBonus() * buff)
    );
}

function getRawShotCount() {
    const base =
        1 +
        upgrades.multiShot.level +
        playerModifiers.extraShotCount +
        playerModifiers.cannonBonusShots +
        playerModifiers.tankBonusShots;
    if (playerModifiers.shotgun) {
        return (playerModifiers.shotgunPellets || 5) + base - 1;
    }
    return base;
}

function getShotCap() {
    return playerModifiers.shotgun ? MAX_SHOTGUN_PELLETS : MAX_SHOTS_PER_VOLLEY;
}

function getShotCount() {
    return Math.min(getShotCap(), getRawShotCount());
}

// Les tirs au-delà du plafond renforcent un peu chaque projectile.
function getExcessShotBonus() {
    return 1 + Math.max(0, getRawShotCount() - getShotCap()) * EXCESS_SHOT_DAMAGE;
}

function getDamage() {
    const xpBuffBonus = isBuffActive("tripleXP") ? 1.05 : 1;
    return (
        player.baseDamage *
        (1 + upgrades.damage.level * 0.15) *
        (1 + perk("cannon") * 0.12) *
        playerModifiers.damageMultiplier *
        getExcessShotBonus() *
        xpBuffBonus
    );
}

function getPierce() {
    return upgrades.pierce.level + perk("piercing");
}

function getProjectileSpeed() {
    const overclock = 1 + upgrades.overclock.level * 0.05;
    return BASE_PROJECTILE_SPEED * playerModifiers.projectileSpeedMultiplier * overclock;
}

function getSpeedMultiplier() {
    let mult = 1;
    if (isBuffActive("speed")) mult *= 1.3;
    return mult;
}

function getDamageTakenMultiplier() {
    const level = upgrades.resistance.level || 0;
    const mitigation = Math.min(0.6, level * 0.1);
    const shield = Math.pow(0.9, perk("shield"));
    return Math.max(0.25, (1 - mitigation) * shield);
}

function applyPlayerDamage(amount, { feedback = true } = {}) {
    if (state.invulnerable > 0) return;
    const finalDamage = amount * getDamageTakenMultiplier();
    player.health -= finalDamage;
    if (player.health < 0) player.health = 0;
    if (feedback) {
        play("hurt", 120);
        shake(7);
        flash("255,59,107", 0.22);
        burst(player.x, player.y, "#ff3b6b", 8, 200, 3);
    }
}

function getComboMultiplier() {
    return Math.min(5, 1 + Math.floor(state.combo / 5) * 0.5);
}

function gainXP(amount) {
    const xpBonus = isBuffActive("tripleXP") ? 3 : 1;
    const xpUpgrade = 1 + upgrades.xpGain.level * 0.2;
    state.xp += amount * xpBonus * xpUpgrade;
    let leveled = false;
    while (state.xp >= state.xpToNext) {
        state.xp -= state.xpToNext;
        state.level += 1;
        state.upgradePoints += 1;
        state.xpToNext = Math.round(state.xpToNext * 1.2 + 20);
        onLevelGained();
        leveled = true;
    }
    if (leveled) {
        play("levelUp");
        ring(player.x, player.y, "#2de2ff", 120, 0.6, 3);
        floatText(player.x, player.y - 52, `NIVEAU ${state.level}`, "#2de2ff", 12);
        checkClassMilestones();
    }
}

function checkClassMilestones() {
    if (player.pendingClassChoice) return;
    // Le plus petit palier non choisi d'abord (avant : le dernier gagnait).
    const tiers = Object.keys(classTiers).map(Number).sort((a, b) => a - b);
    for (const level of tiers) {
        if (state.level >= level && !completedClassTiers.has(level)) {
            player.pendingClassChoice = true;
            showClassOverlay(level);
            return;
        }
    }
}

function onLevelGained() {
    // Avant : chaque niveau donnait un drone gratuit (4 drones dès le niveau 5),
    // ce qui rendait la classe Drone Controller inutile.
    if (player.selectedClasses.includes("droneController")) {
        playerModifiers.droneCount = Math.min(3, 2 + Math.floor((state.level - 10) / 10));
    }
    updateSniperCannonProgression();
    updateTankProgression();
}

function updateSniperCannonProgression() {
    if (!player.selectedClasses.includes("sniper")) {
        playerModifiers.cannonBonusShots = 0;
        return;
    }
    const targetTier = Math.min(3, 2 + Math.floor(Math.max(0, state.level - 10) / 10));
    playerModifiers.cannonBonusShots = Math.max(0, targetTier - 1);
}

function updateTankProgression() {
    if (!player.selectedClasses.includes("octoTank")) {
        playerModifiers.tankBonusShots = 0;
        return;
    }
    let bonus = 0;
    // Avant : jusqu'à 12 tirs de face + 8 rayons, l'écran était saturé.
    if (state.level >= 30) bonus = 2; // 3 tirs de face
    else if (state.level >= 20) bonus = 1; // 2 tirs de face
    playerModifiers.tankBonusShots = bonus;
}

// Les buffs se basent sur le temps de jeu (et non l'horloge réelle)
// pour ne pas s'écouler pendant la pause.
function addBuff(key, duration) {
    activeBuffs[key] = Math.max(activeBuffs[key] || 0, state.time) + duration / 1000;
}

function isBuffActive(key) {
    return (activeBuffs[key] || 0) > state.time;
}

// ---------------------------------------------------------------------------
// Bonus
// ---------------------------------------------------------------------------

function spawnPickup(x = null, y = null) {
    const available = lootTypes.filter(
        (t) => (!t.minLevel || state.level >= t.minLevel) && (!t.rare || Math.random() < 0.35)
    );
    const type = available[Math.floor(Math.random() * available.length)];
    const margin = 80;
    pickups.push({
        x: x ?? margin + Math.random() * (canvas.width - margin * 2),
        y: y ?? margin + Math.random() * (canvas.height - margin * 2),
        type,
        pulse: Math.random() * Math.PI * 2,
        life: 18,
    });
}

function updatePickups(dt) {
    if (!getSector().arena) pickupTimer += dt * 1000; // pas de bonus dans l'arène
    const interval = pickupInterval * Math.pow(0.85, perk("lucky"));
    if (pickupTimer >= interval && pickups.length < 4) {
        pickupTimer = 0;
        spawnPickup();
    }

    const magnetRange = 60 + perk("magnet") * 90;
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
        const pickup = pickups[i];
        pickup.pulse += dt * 3;
        pickup.life -= dt;
        if (pickup.life <= 0) {
            pickups.splice(i, 1);
            continue;
        }
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < magnetRange) {
            const pull = (1 - dist / magnetRange) * 420 * dt;
            pickup.x += (dx / dist) * pull;
            pickup.y += (dy / dist) * pull;
        }
        if (dist < player.radius + 14) {
            applyPickupEffect(pickup.type);
            burst(pickup.x, pickup.y, pickup.type.color, 18, 240, 3);
            ring(pickup.x, pickup.y, pickup.type.color, 60, 0.35, 2);
            floatText(pickup.x, pickup.y - 20, pickup.type.label, pickup.type.color, 9);
            play("pickup");
            pickups.splice(i, 1);
        }
    }
}

function spawnMine() {
    mines.push({
        x: player.x,
        y: player.y,
        radius: 18 + playerModifiers.projectileSizeBonus * 0.6,
        damage: getDamage() * 1.8,
        life: 6500,
        maxLife: 6500,
        pulse: Math.random() * Math.PI * 2,
    });
}

function updateMines(dt) {
    if (playerModifiers.overseer) {
        overseerMineTimer += dt * 1000;
        if (overseerMineTimer >= 3200) {
            overseerMineTimer = 0;
            spawnMine();
        }
    }
    for (let i = mines.length - 1; i >= 0; i -= 1) {
        const mine = mines[i];
        mine.life -= dt * 1000;
        mine.pulse += dt * 4;
        if (mine.life <= 0) {
            mines.splice(i, 1);
            continue;
        }
        for (let j = enemies.length - 1; j >= 0; j -= 1) {
            const e = enemies[j];
            const dist = Math.hypot(e.x - mine.x, e.y - mine.y);
            if (dist < mine.radius + e.size) {
                burst(mine.x, mine.y, "#ffb35e", 26, 320, 3);
                ring(mine.x, mine.y, "#ffb35e", 90, 0.4, 4);
                shake(5);
                damageEnemy(e, mine.damage);
                mines.splice(i, 1);
                break;
            }
        }
    }
}

function applyPickupEffect(type) {
    if (type.key === "rareSkin") {
        unlockRandomSkin();
        gainXP(state.xpToNext);
        return;
    }

    if (type.key === "heal") {
        const healAmount = type.heal || 20;
        player.health = Math.min(player.maxHealth, player.health + healAmount);
        return;
    }

    if (type.key === "upgradeOrb") {
        const eligible = ["health", "damage", "resistance", "pierce"];
        const candidates = eligible
            .map((key) => upgrades[key])
            .filter((u) => u && u.level < u.maxLevel);
        if (candidates.length > 0) {
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            chosen.level += 1;
            if (chosen === upgrades.health) {
                recalcPlayerStats({ refillHealth: true });
            }
            refreshUpgradePanel();
        }
        return;
    }

    // Buffs temporaires
    addBuff(type.key, type.duration);

    // Améliorations gratuites des compétences associées
    // (le bonus de dégâts de l'XP x3 est désormais temporaire, voir getDamage)
    if (type.key === "speed") {
        const up = upgrades.moveSpeed;
        if (up.level < up.maxLevel) {
            up.level += 1;
            applyUpgradeEffect("moveSpeed");
        }
    } else if (type.key === "fireRate") {
        const up = upgrades.fireRate;
        if (up.level < up.maxLevel) {
            up.level += 1;
        }
    } else if (type.key === "aimbot") {
        const up = upgrades.multiShot;
        if (up.level < up.maxLevel) {
            up.level += 1;
        }
    }
    refreshUpgradePanel();
}

// ---------------------------------------------------------------------------
// Ennemis
// ---------------------------------------------------------------------------

// Position d'apparition sur les bords, loin du joueur (avant : n'importe où,
// y compris directement sur le joueur).
function pickSpawnPoint(size) {
    const minDistance = Math.min(canvas.width, canvas.height) * 0.38;
    let best = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const side = Math.floor(Math.random() * 4);
        const inset = size + 10;
        let x;
        let y;
        if (side === 0) {
            x = inset + Math.random() * (canvas.width - inset * 2);
            y = inset;
        } else if (side === 1) {
            x = canvas.width - inset;
            y = inset + Math.random() * (canvas.height - inset * 2);
        } else if (side === 2) {
            x = inset + Math.random() * (canvas.width - inset * 2);
            y = canvas.height - inset;
        } else {
            x = inset;
            y = inset + Math.random() * (canvas.height - inset * 2);
        }
        const dist = Math.hypot(x - player.x, y - player.y);
        if (!best || dist > best.dist) best = { x, y, dist };
        if (dist >= minDistance) break;
    }
    return best;
}

// Dégâts par seconde théoriques du joueur (tir principal + drones).
function estimatePlayerDps() {
    // Les plombs du Shotgun (70 % de dégâts, cône large) touchent rarement tous.
    const perShot = playerModifiers.shotgun ? 0.7 * 0.55 : 1;
    const volley = getDamage() * getShotCount() * perShot;
    const main = volley * (1000 / getFireCooldown());
    const droneCount = Math.min(MAX_DRONES, playerModifiers.droneCount + perk("drone"));
    const droneDps =
        (droneCount * playerModifiers.droneDamage * (1 + perk("cannon") * 0.12) * 1000) /
        playerModifiers.droneFireCooldown;
    return main + droneDps;
}

function bossRage(enemy) {
    return enemy.phase === 3 ? 1.75 : enemy.phase === 2 ? 1.35 : 1;
}

function bossShot(enemy, angle, { speed = 220, damage = 12, radius = 6, from = enemy, ...extra } = {}) {
    spawnEnemyProjectile(from, angle, {
        ...extra,
        scaled: true,
        speed: speed * (1 + (enemy.phase - 1) * 0.08),
        damage: damage * enemy.bulletDamage,
        radius,
    });
}

function bossRing(enemy, count, offset, options) {
    for (let k = 0; k < count; k += 1) {
        bossShot(enemy, offset + ((Math.PI * 2) / count) * k, options);
    }
}

// Tir visant l'endroit où le joueur sera (légère anticipation).
function leadAngle(from, speed) {
    const dist = Math.hypot(player.x - from.x, player.y - from.y);
    const t = Math.min(0.8, dist / speed) * 0.7;
    return Math.atan2(player.y + player.vy * t - from.y, player.x + player.vx * t - from.x);
}

// Passage de phase à 66 % et 33 % de vie : bouclier, onde de choc, renforts.
function updateBossPhase(enemy) {
    const ratio = enemy.currentHealth / enemy.health;
    const target = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    if (target <= enemy.phase) return;
    enemy.phase = target;
    enemy.phaseShield = 1.4;
    enemy.attackState = null;
    enemy.attackTimer = 1.6;
    bossRing(enemy, 20 + enemy.phase * 4, Math.random() * Math.PI, { speed: 200, damage: 14, radius: 7 });
    const minions = getSector().arena ? 0 : 1 + enemy.phase;
    if (getSector().arena) {
        // Pas de bonus dans l'arène : un petit soin à chaque phase à la place.
        player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.3);
        floatText(player.x, player.y - 40, "+30 % PV", "#5dffa8", 11);
    }
    if (enemy.behavior === "bossBlackPrism") {
        // Supernova : étoile de lasers depuis le cœur
        for (let k = 0; k < 16; k += 1) {
            enemy.beams.push({ angle: (Math.PI / 8) * k + enemy.phase * 0.2, spin: 0, warn: 0.7, fire: 0.35, width: 12, hue: k * 22, loud: k === 0 });
        }
    }
    for (let k = 0; k < minions && enemies.length < getMaxEnemies() + 4; k += 1) spawnEnemy();
    ring(enemy.x, enemy.y, "#ff3b6b", enemy.size * 5, 0.7, 5);
    floatText(enemy.x, enemy.y - enemy.size - 24, enemy.phase === 3 ? "FUREUR !" : "ENRAGÉ !", "#ff3b6b", 14);
    shake(16);
    flash("255,59,107", 0.35);
    play("boss");
}

function spawnEnemy(isBoss = false) {
    const diff = getDifficultyConfig();
    if (isBoss) {
        const boss = pickBossConfig();
        const levelFactor = 1 + state.level * 0.06;
        const scaling = (levelFactor + bossCount * 0.25) * sectorHealthMult();
        const bossHealthBoost = diff.enemyHealthMultiplier * (1.5 + state.sectorIndex * 0.3);
        // Le boss s'adapte à la puissance de feu du joueur : il doit tenir
        // un certain temps même face à un tank surpuissant.
        const toughness = Math.min(1.8, Math.max(0.7, diff.enemyHealthMultiplier));
        const minFightSeconds = (12 + state.sectorIndex * 3.5) * toughness;
        const spawn = getSector().arena
            ? { x: canvas.width / 2, y: canvas.height * 0.35 }
            : pickSpawnPoint(boss.size);
        const health =
            Math.max(boss.health * scaling * bossHealthBoost, estimatePlayerDps() * minFightSeconds) *
            (boss.hpMult || 1);
        enemies.push({
            ...boss,
            x: spawn.x,
            y: spawn.y,
            health,
            currentHealth: health,
            speed: boss.speed * Math.min(1.3, diff.enemySpeedMultiplier) * sectorSpeedMult(),
            xp: boss.xp * (1 + state.sectorIndex * 0.3),
            isBoss: true,
            phase: 1,
            phaseShield: 0,
            bulletDamage: 0.7 + state.sectorIndex * 0.2,
            density: Math.min(4, state.sectorIndex), // balles en plus au fil des secteurs
            spin: 0,
            droneSwarm: [],
            shootTimer: 1500,
            attackTimer: 3.5,
            attackState: null,
            beams: [],
            visualAngle: 0,
            hitFlash: 0,
            spawnAnim: 0,
        });
        bossCount += 1;
        ring(spawn.x, spawn.y, boss.color, 220, 0.9, 6);
        shake(14);
        flash("255,43,214", 0.35);
        play("boss");
        return;
    }

    let pool = enemyArchetypes.filter((e) => (e.minSector || 0) <= state.sectorIndex);
    if (enemies.filter((e) => e.behavior === "laserMob").length >= MAX_LASER_MOBS) {
        pool = pool.filter((e) => e.behavior !== "laserMob");
    }
    if (specialWaveType === "hexOnly") {
        const hexPool = pool.filter((e) => e.shape === "hex");
        if (hexPool.length > 0) pool = hexPool;
    }
    const type = pickWeightedEnemyType(pool, state.difficultyIndex);
    // Vie des ennemis : suit mieux la montée en puissance du joueur
    // (avant ils mouraient à peine apparus en milieu de partie).
    const levelFactor = 1.6 + state.level * 0.06;
    const healthScaling =
        levelFactor * (1 + elapsedTime * diff.enemyHealthGrowth) * sectorHealthMult();
    const speedScaling = (1 + elapsedTime * diff.enemySpeedGrowth) * sectorSpeedMult();
    const maxHealth = Math.round(
        type.health * diff.enemyHealthMultiplier * healthScaling
    );
    const speed = type.speed * diff.enemySpeedMultiplier * speedScaling;
    const xpReward = Math.round(type.xp * (0.8 + diff.enemyHealthMultiplier * 0.2));
    const spawn = pickSpawnPoint(type.size);

    enemies.push({
        ...type,
        x: spawn.x,
        y: spawn.y,
        health: maxHealth,
        currentHealth: maxHealth,
        speed,
        xp: xpReward,
        shootTimer: 600 + Math.random() * 600,
        beams: [],
        laserTimer: 1.5 + Math.random() * 1.5,
        bulletDamage: 0.5 * sectorDamageMult(),
        visualAngle: 0,
        hitFlash: 0,
        spawnAnim: 0,
    });
    ring(spawn.x, spawn.y, type.color, type.size * 1.8, 0.35, 2);
}

// Inflige des dégâts à un ennemi et gère sa mort (tirs, drones, mines).
function damageEnemy(enemy, amount, knockback = null) {
    if (enemy.dead) return;
    if (enemy.phaseShield > 0) {
        enemy.hitFlash = 0.03;
        return;
    }
    enemy.currentHealth -= amount;
    enemy.hitFlash = 0.08;
    if (knockback) {
        const resist = enemy.isBoss ? 0.04 : 1;
        enemy.x += knockback.x * resist;
        enemy.y += knockback.y * resist;
    }
    if (enemy.currentHealth <= 0) {
        killEnemy(enemy);
    } else {
        if (enemy.isBoss) updateBossPhase(enemy);
        play("hit", 45);
    }
}

function killEnemy(enemy, { silent = false } = {}) {
    if (enemy.dead) return;
    enemy.dead = true;
    const index = enemies.indexOf(enemy);
    if (index >= 0) enemies.splice(index, 1);

    state.combo += 1;
    state.comboTimer = 2.2 + perk("combo") * 0.8;
    const mult = getComboMultiplier();
    const points = Math.round(enemy.xp * 10 * mult);
    state.score += points;

    burst(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 90 : 22, enemy.isBoss ? 520 : 280, enemy.isBoss ? 5 : 3);
    ring(enemy.x, enemy.y, enemy.color, enemy.size * (enemy.isBoss ? 5 : 2.4), enemy.isBoss ? 0.8 : 0.35, enemy.isBoss ? 6 : 3);
    floatText(enemy.x, enemy.y - enemy.size, `+${points}`, mult > 1 ? "#ff2bd6" : "#ffe45e", mult > 1 ? 11 : 9);
    if (mult > 1 && state.combo % 5 === 0) {
        floatText(enemy.x, enemy.y - enemy.size - 20, `COMBO x${mult}`, "#ff2bd6", 12);
    }

    if (enemy.isBoss) {
        addBuff("tripleXP", 8000);
        waveIndex += 1;
        if (waveIndex % 3 === 0) {
            specialWaveType = "hexOnly";
            specialWaveTimeLeft = 18;
        }
        shake(24);
        flash("255,255,255", 0.7);
        play("bossKill");
        gainXP(enemy.xp);
        onBossDefeated(enemy);
        return;
    }

    if (!silent) {
        shake(2.5);
        play("kill", 40);
    }
    gainXP(enemy.xp);

    if (state.sectorPhase === "fight") {
        state.sectorKills += 1;
        if (state.sectorKills >= state.sectorGoal) startBossPhase();
    }

    const dropChance = 0.035 + perk("lucky") * 0.02;
    if (Math.random() < dropChance && pickups.length < 6) {
        spawnPickup(enemy.x, enemy.y);
    }
}

function startBossPhase() {
    state.sectorPhase = "boss";
    state.phaseTime = 0;
    spawnEnemy(true);
}

function onBossDefeated(boss) {
    // Tous les ennemis restants explosent en chaîne, puis le portail s'ouvre.
    enemyProjectiles.length = 0;
    const remaining = [...enemies];
    remaining.forEach((enemy) => killEnemy(enemy, { silent: true }));
    state.sectorPhase = "portal";
    state.phaseTime = 0;
    const px = Math.max(90, Math.min(canvas.width - 90, boss.x));
    const py = Math.max(90, Math.min(canvas.height - 90, boss.y));
    state.portal = { x: px, y: py, r: 0, targetR: 46 };
    floatText(canvas.width / 2, canvas.height / 2 - 40, "PORTAIL OUVERT", "#2de2ff", 16);
    setTimeout(() => play("portal"), 400);
}

function createProjectile({
    x,
    y,
    angle,
    speed,
    damage,
    radius = 6,
    life = 1.5,
    homingStrength = 0,
    pierce = 0,
    color = null,
}) {
    const sizeBonus =
        playerModifiers.projectileSizeBonus +
        upgrades.impact.level * 1 +
        (playerModifiers.damageMultiplier > 2 ? 2 : 0);
    const finalRadius = radius + sizeBonus;
    if (projectiles.length >= MAX_PLAYER_PROJECTILES) projectiles.shift();
    projectiles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        radius: finalRadius,
        life: 0,
        maxLife: life,
        damage,
        homingStrength,
        pierce,
        color,
        hit: new Set(),
    });
}

function spawnEnemyProjectile(enemy, angle, options = {}) {
    const speed = options.speed || 210;
    // Les dégâts des boss sont déjà mis à l'échelle dans bossShot.
    const damage = (options.damage || 15) * (enemy.isBoss || options.scaled ? 1 : sectorDamageMult());
    const radius = options.radius || 6;
    enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        damage,
        life: 0,
        maxLife: options.maxLife || 2.8,
        homing: options.homing || 0, // rad/s vers le joueur
        curve: options.curve || 0, // rad/s, trajectoire courbe
        color: options.color || null,
    });
}

function findNearestEnemy(x, y) {
    let closest = null;
    let closestDist = Infinity;
    enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - x, enemy.y - y);
        if (dist < closestDist) {
            closest = enemy;
            closestDist = dist;
        }
    });
    return closest;
}

function shoot() {
    if (player.shotTimer > 0) return;
    player.shotTimer = getFireCooldown() / 1000;
    player.recoil = 1;

    const count = getShotCount();
    const sniperHoming = player.selectedClasses.includes("sniper") ? 0.06 : 0;
    const homing = (isBuffActive("aimbot") ? 0.08 : 0) + sniperHoming;
    const projectileSpeed = getProjectileSpeed();
    const pierce = getPierce();
    play("shoot", 70);

    const muzzle = player.radius + 18;
    burst(
        player.x + Math.cos(player.angle) * muzzle,
        player.y + Math.sin(player.angle) * muzzle,
        playerSkins[currentSkinIndex].cannon,
        2,
        90,
        2
    );

    player.volley = (player.volley || 0) + 1;
    if (playerModifiers.octoRadial && player.volley % 2 === 0) {
        const rays = 8;
        const base = state.time;
        for (let i = 0; i < rays; i += 1) {
            const angle = (Math.PI * 2 * i) / rays + base * 0.4;
            createProjectile({
                x: player.x,
                y: player.y,
                angle,
                speed: projectileSpeed * 0.85,
                damage: getDamage() * 0.6,
                life: 0.9 + playerModifiers.projectileLifeBonus,
                radius: 6,
                homingStrength: homing * 0.5,
                pierce,
            });
        }
        // Continue to fire main volley as well
    }

    if (playerModifiers.shotgun) {
        const spread = playerModifiers.shotgunSpread;
        for (let i = 0; i < count; i += 1) {
            const offset =
                count === 1 ? 0 : -spread / 2 + (spread / (count - 1)) * i;
            const angle = player.angle + offset;
            createProjectile({
                x: player.x + Math.cos(angle) * player.radius,
                y: player.y + Math.sin(angle) * player.radius,
                angle,
                speed: projectileSpeed * 0.8,
                damage: getDamage() * 0.7,
                life: 0.7 + playerModifiers.projectileLifeBonus,
                homingStrength: homing,
                pierce,
            });
        }
        if (playerModifiers.shotgunRecoil) {
            player.vx -= Math.cos(player.angle) * playerModifiers.shotgunRecoil;
            player.vy -= Math.sin(player.angle) * playerModifiers.shotgunRecoil;
        }
        return;
    }

    const spreadBase = playerModifiers.tankBonusShots > 0 ? 0.08 : 0.12;
    const spread = Math.min(0.5, spreadBase * (count - 1));
    for (let i = 0; i < count; i += 1) {
        const offset = count === 1 ? 0 : -spread / 2 + (spread / (count - 1)) * i;
        const angle = player.angle + offset;
        createProjectile({
            x: player.x + Math.cos(angle) * player.radius,
            y: player.y + Math.sin(angle) * player.radius,
            angle,
            speed: projectileSpeed,
            damage: getDamage(),
            life: 1.5 + playerModifiers.projectileLifeBonus,
            radius: playerModifiers.damageMultiplier > 2 ? 9 : 6,
            homingStrength: homing,
            pierce,
        });
    }

    if (playerModifiers.overseer) {
        const extra = count >= 4 ? 2 : 1;
        const target = findNearestEnemy(player.x, player.y);
        const targetAngle =
            target ? Math.atan2(target.y - player.y, target.x - player.x) : player.angle;
        for (let i = 0; i < extra; i += 1) {
            const sway = (i - extra / 2) * 0.08;
            createProjectile({
                x: player.x,
                y: player.y,
                angle: targetAngle + sway,
                speed: projectileSpeed * 0.95,
                damage: getDamage() * 1.35,
                life: 1.6 + playerModifiers.projectileLifeBonus,
                radius: 8,
                homingStrength: homing + 0.12,
                pierce,
                color: "#ffb35e",
            });
        }
    }
}

function updatePlayer(dt) {
    let inputX = 0;
    let inputY = 0;
    const arrowsMove = !state.trackpadMode;

    if (keys.KeyW || (arrowsMove && keys.ArrowUp)) inputY -= 1;
    if (keys.KeyS || (arrowsMove && keys.ArrowDown)) inputY += 1;
    if (keys.KeyA || (arrowsMove && keys.ArrowLeft)) inputX -= 1;
    if (keys.KeyD || (arrowsMove && keys.ArrowRight)) inputX += 1;

    let targetVX = 0;
    let targetVY = 0;
    const length = Math.hypot(inputX, inputY);
    if (length > 0) {
        const topSpeed = player.maxSpeed * getSpeedMultiplier();
        targetVX = (inputX / length) * topSpeed;
        targetVY = (inputY / length) * topSpeed;
    }

    const smoothing = 1 - Math.exp(-player.acceleration * dt);
    player.vx += (targetVX - player.vx) * smoothing;
    player.vy += (targetVY - player.vy) * smoothing;

    const drift = Math.max(0, 1 - player.drag * dt);
    player.vx *= drift;
    player.vy *= drift;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Traînée néon quand on se déplace vite
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > 120 && Math.random() < speed / 900) {
        particles.push({
            x: player.x - (player.vx / speed) * player.radius,
            y: player.y - (player.vy / speed) * player.radius,
            vx: -player.vx * 0.2,
            vy: -player.vy * 0.2,
            life: 0,
            max: 0.35,
            color: playerSkins[currentSkinIndex].body,
            size: 3,
        });
    }

    let aimDX = mouse.x - player.x;
    let aimDY = mouse.y - player.y;
    if (state.trackpadMode) {
        const aimX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
        const aimY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
        if (aimX !== 0 || aimY !== 0) {
            player.trackpadAim = Math.atan2(aimY, aimX);
        }
        if (player.trackpadAim !== undefined) {
            aimDX = Math.cos(player.trackpadAim);
            aimDY = Math.sin(player.trackpadAim);
        }
    }
    if (aimDX !== 0 || aimDY !== 0) player.angle = Math.atan2(aimDY, aimDX);

    player.shotTimer = Math.max(0, (player.shotTimer || 0) - dt);
    player.recoil = Math.max(0, (player.recoil || 0) - dt * 8);
    state.invulnerable = Math.max(0, state.invulnerable - dt);

    if (perk("regen") > 0 && player.health > 0) {
        player.health = Math.min(player.maxHealth, player.health + perk("regen") * 1.5 * dt);
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
        const p = projectiles[i];
        if (p.homingStrength && enemies.length > 0) {
            const target = findNearestEnemy(p.x, p.y);
            if (target) {
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.hypot(dx, dy) || 1;
                const ax = (dx / dist) * p.homingStrength * 800;
                const ay = (dy / dist) * p.homingStrength * 800;
                p.vx += ax * dt;
                p.vy += ay * dt;
                const speed = Math.hypot(p.vx, p.vy) || 1;
                const desired = p.speed;
                p.vx = (p.vx / speed) * desired;
                p.vy = (p.vy / speed) * desired;
            }
        }
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;

        if (
            p.life > p.maxLife ||
            p.x < -50 ||
            p.x > canvas.width + 50 ||
            p.y < -50 ||
            p.y > canvas.height + 50
        ) {
            projectiles.splice(i, 1);
        }
    }
}

function updateEnemyProjectiles(dt) {
    for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
        const p = enemyProjectiles[i];
        if (p.homing || p.curve) {
            let heading = Math.atan2(p.vy, p.vx);
            const speed = Math.hypot(p.vx, p.vy);
            if (p.homing) {
                const want = Math.atan2(player.y - p.y, player.x - p.x);
                const diff = Math.atan2(Math.sin(want - heading), Math.cos(want - heading));
                heading += Math.max(-p.homing * dt, Math.min(p.homing * dt, diff));
            }
            heading += p.curve * dt;
            p.vx = Math.cos(heading) * speed;
            p.vy = Math.sin(heading) * speed;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        if (
            p.life > p.maxLife ||
            p.x < -60 ||
            p.x > canvas.width + 60 ||
            p.y < -60 ||
            p.y > canvas.height + 60
        ) {
            enemyProjectiles.splice(i, 1);
            continue;
        }
        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist < player.radius + p.radius && state.invulnerable <= 0) {
            applyPlayerDamage(p.damage);
            burst(p.x, p.y, "#ff3b6b", 10, 180, 2);
            enemyProjectiles.splice(i, 1);
        }
    }
}

function updateDrones(dt) {
    const bonusDrones = isBuffActive("droneAssist") ? 2 : 0;
    const desiredCount = Math.min(
        MAX_DRONES,
        playerModifiers.droneCount + perk("drone") + bonusDrones
    );

    if (desiredCount <= 0) {
        drones.length = 0;
        return;
    }
    if (drones.length !== desiredCount) {
        // Répartit les drones uniformément autour du joueur.
        const baseAngle = drones[0]?.angle || 0;
        while (drones.length < desiredCount) {
            drones.push({ angle: 0, cooldown: 0, orbit: 80, x: player.x, y: player.y });
        }
        drones.length = desiredCount;
        drones.forEach((drone, index) => {
            drone.angle = baseAngle + (Math.PI * 2 * index) / desiredCount;
        });
    }
    drones.forEach((drone) => {
        drone.angle += dt * 1.1;
        const tx = player.x + Math.cos(drone.angle) * drone.orbit;
        const ty = player.y + Math.sin(drone.angle) * drone.orbit;
        const follow = 1 - Math.exp(-14 * dt);
        drone.x += (tx - drone.x) * follow;
        drone.y += (ty - drone.y) * follow;
        drone.cooldown -= dt * 1000;
        if (drone.cooldown <= 0) {
            const target = findNearestEnemy(drone.x, drone.y);
            if (target) {
                const angle = Math.atan2(target.y - drone.y, target.x - drone.x);
                createProjectile({
                    x: drone.x,
                    y: drone.y,
                    angle,
                    speed: getProjectileSpeed() * 0.9,
                    damage: playerModifiers.droneDamage * (1 + perk("cannon") * 0.12),
                    radius: 5,
                    life: 1.2,
                    homingStrength: 0.05,
                    color: "#ffe45e",
                });
                drone.cooldown = playerModifiers.droneFireCooldown;
            }
        }
    });
}

function updateSpawning(dt) {
    if (state.sectorPhase !== "fight" && state.sectorPhase !== "boss") return;
    if (getSector().arena) return; // l'arène : lui et toi, personne d'autre
    enemySpawnTimer += dt * 1000;
    let guard = 0;
    while (enemySpawnTimer >= getSpawnInterval() && guard < 10) {
        const interval = getSpawnInterval();
        if (interval <= 0) break;
        enemySpawnTimer -= interval;
        if (enemies.length < getMaxEnemies()) {
            // Par petits groupes dans les secteurs avancés
            const pack = state.sectorPhase === "fight" ? 1 + Math.floor(state.sectorIndex / 3) : 1;
            for (let k = 0; k < pack && enemies.length < getMaxEnemies(); k += 1) spawnEnemy();
        } else {
            enemySpawnTimer = 0;
            break;
        }
        guard += 1;
    }

    if (specialWaveTimeLeft > 0) {
        specialWaveTimeLeft -= dt;
        if (specialWaveTimeLeft <= 0) {
            specialWaveType = null;
        }
    }
}

// ---------------------------------------------------------------------------
// Boss : trois phases, attaques télégraphiées
// ---------------------------------------------------------------------------

function updateBoss(enemy, behavior, dx, dy, dist, dt) {
    const rage = bossRage(enemy);
    enemy.phaseShield = Math.max(0, (enemy.phaseShield || 0) - dt);
    enemy.attackTimer -= dt * rage;
    const atk = enemy.attackState;

    if (behavior === "bossTank") {
        // Titan : anneaux de balles, écho en phase 2+, charge dévastatrice.
        if (atk && atk.type === "windup") {
            atk.t -= dt;
            atk.angle = Math.atan2(dy, dx); // suit le joueur jusqu'au dernier moment
            if (atk.t <= 0) {
                enemy.attackState = { type: "dash", t: 0.5, angle: atk.angle, hit: false };
                shake(8);
            }
        } else if (atk && atk.type === "dash") {
            atk.t -= dt;
            const dashSpeed = 780 + enemy.phase * 60;
            enemy.x += Math.cos(atk.angle) * dashSpeed * dt;
            enemy.y += Math.sin(atk.angle) * dashSpeed * dt;
            if (Math.random() < 0.6) burst(enemy.x, enemy.y, enemy.color, 2, 120, 3);
            if (!atk.hit && dist < player.radius + enemy.size + 6) {
                atk.hit = true;
                applyPlayerDamage(30 * enemy.bulletDamage);
            }
            if (atk.t <= 0) {
                enemy.attackState = null;
                // Onde de choc à l'arrêt
                bossRing(enemy, 6 + enemy.phase * 2 + enemy.density, Math.random() * Math.PI, { speed: 190, damage: 12, radius: 7 });
            }
        } else {
            enemy.x += (dx / dist) * enemy.speed * 0.75 * dt;
            enemy.y += (dy / dist) * enemy.speed * 0.75 * dt;
            if (enemy.attackTimer <= 0) {
                enemy.attackState = { type: "windup", t: 0.8 - enemy.phase * 0.1, angle: Math.atan2(dy, dx) };
                enemy.attackTimer = 5.5;
            }
        }
        if (enemy.shootTimer <= 0 && (!atk || atk.type !== "dash")) {
            enemy.shootTimer = 2000 / rage;
            enemy.spin = (enemy.spin || 0) + Math.PI / 10;
            const count = 6 + enemy.phase * 2 + enemy.density;
            bossRing(enemy, count, enemy.spin, { speed: 200, damage: 13, radius: 8 });
            if (enemy.phase >= 2) enemy.echoTimer = 0.28;
            if (enemy.phase >= 3) {
                const a = leadAngle(enemy, 360);
                [-0.12, 0, 0.12].forEach((o) => bossShot(enemy, a + o, { speed: 360, damage: 14, radius: 7 }));
            }
        }
        if (enemy.echoTimer > 0) {
            enemy.echoTimer -= dt;
            if (enemy.echoTimer <= 0) {
                const count = 6 + enemy.phase * 2 + enemy.density;
                bossRing(enemy, count, enemy.spin + Math.PI / count, { speed: 170, damage: 12, radius: 8 });
            }
        }
    } else if (behavior === "bossDrone") {
        // Spectre : drones qui anticipent, téléportations en phase 2+.
        if (atk && atk.type === "blink") {
            atk.t -= dt;
            if (atk.t <= 0) {
                burst(enemy.x, enemy.y, enemy.color, 30, 300, 3);
                enemy.x = atk.x;
                enemy.y = atk.y;
                ring(enemy.x, enemy.y, enemy.color, 140, 0.4, 4);
                const a = leadAngle(enemy, 320);
                const fan = 3 + enemy.phase * 2;
                for (let k = 0; k < fan; k += 1) {
                    bossShot(enemy, a + (k - (fan - 1) / 2) * 0.16, { speed: 320, damage: 12 });
                }
                enemy.attackState = null;
            }
        } else {
            const moveDir = dist > 280 ? 1 : dist < 200 ? -1 : 0.25;
            enemy.x += (dx / dist) * enemy.speed * moveDir * dt;
            enemy.y += (dy / dist) * enemy.speed * moveDir * dt;
            if (enemy.phase >= 2 && enemy.attackTimer <= 0) {
                const a = Math.random() * Math.PI * 2;
                const r = 230 + Math.random() * 80;
                const margin = enemy.size + 10;
                enemy.attackState = {
                    type: "blink",
                    t: 0.55,
                    x: Math.max(margin, Math.min(canvas.width - margin, player.x + Math.cos(a) * r)),
                    y: Math.max(margin, Math.min(canvas.height - margin, player.y + Math.sin(a) * r)),
                };
                enemy.attackTimer = 4.5;
            }
        }
        if (!enemy.droneSwarm) enemy.droneSwarm = [];
        const droneTarget = 2 + enemy.phase;
        while (enemy.droneSwarm.length < droneTarget) {
            enemy.droneSwarm.push({ angle: 0 });
        }
        enemy.droneSwarm.forEach((drone, index) => {
            drone.angle = state.time * (1.5 + enemy.phase * 0.3) + (Math.PI * 2 * index) / droneTarget;
        });
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 950 / rage;
            enemy.droneSwarm.forEach((drone) => {
                const from = {
                    x: enemy.x + Math.cos(drone.angle) * 70,
                    y: enemy.y + Math.sin(drone.angle) * 70,
                };
                bossShot(enemy, leadAngle(from, 300), { speed: 300, damage: 11, from });
            });
        }
    } else if (behavior === "bossSpiral") {
        // Cyclone : spirale à plusieurs bras, contre-spirale puis salves visées.
        const turn = enemy.phase === 2 ? -1 : 1;
        enemy.spin = (enemy.spin || 0) + dt * (1.6 + enemy.phase * 0.35) * turn;
        enemy.orbit = (enemy.orbit || 0) + dt * 1.2;
        enemy.x += (Math.cos(enemy.orbit) * 0.45 + (dx / dist) * 0.3) * enemy.speed * dt;
        enemy.y += (Math.sin(enemy.orbit) * 0.45 + (dy / dist) * 0.3) * enemy.speed * dt;
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 170 / Math.sqrt(rage);
            const arms = 2 + enemy.phase;
            bossRing(enemy, arms, enemy.spin, { speed: 230, damage: 10 });
            if (enemy.phase >= 2) {
                enemy.counter = (enemy.counter || 0) + 1;
                if (enemy.counter % 2 === 0) bossRing(enemy, 2, -enemy.spin * 1.3, { speed: 190, damage: 10, radius: 8 });
            }
        }
        if (enemy.phase >= 2 && enemy.attackTimer <= 0) {
            enemy.attackTimer = 3.2;
            enemy.burstLeft = enemy.phase === 3 ? 5 : 3;
            enemy.burstTimer = 0;
        }
        if (enemy.burstLeft > 0) {
            enemy.burstTimer -= dt;
            if (enemy.burstTimer <= 0) {
                enemy.burstTimer = 0.12;
                enemy.burstLeft -= 1;
                bossShot(enemy, leadAngle(enemy, 400), { speed: 400, damage: 13, radius: 7 });
            }
        }
    } else if (behavior === "bossHydra") {
        // Hydre : têtes qui crachent tour à tour des balles courbes.
        const want = 260;
        const sway = Math.sin(state.time * 1.7) * 0.6;
        const moveDir = dist > want ? 1 : dist < want - 60 ? -1 : 0;
        enemy.x += ((dx / dist) * moveDir - (dy / dist) * sway) * enemy.speed * dt;
        enemy.y += ((dy / dist) * moveDir + (dx / dist) * sway) * enemy.speed * dt;
        const heads = 2 + enemy.phase;
        if (!enemy.droneSwarm) enemy.droneSwarm = [];
        enemy.droneSwarm.length = Math.min(enemy.droneSwarm.length, heads);
        while (enemy.droneSwarm.length < heads) enemy.droneSwarm.push({ angle: 0 });
        enemy.droneSwarm.forEach((head, index) => {
            head.angle = enemy.visualAngle + (index - (heads - 1) / 2) * 0.7 + Math.sin(state.time * 3 + index) * 0.15;
        });
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 380 / rage;
            enemy.headIndex = ((enemy.headIndex || 0) + 1) % heads;
            const head = enemy.droneSwarm[enemy.headIndex];
            const from = { x: enemy.x + Math.cos(head.angle) * 70, y: enemy.y + Math.sin(head.angle) * 70 };
            const a = Math.atan2(player.y - from.y, player.x - from.x);
            bossShot(enemy, a - 0.35, { speed: 250, damage: 11, from, curve: 0.9, color: "#5dffa8" });
            bossShot(enemy, a + 0.35, { speed: 250, damage: 11, from, curve: -0.9, color: "#5dffa8" });
            if (enemy.phase >= 2) bossShot(enemy, a, { speed: 330, damage: 12, from });
        }
        if (enemy.phase >= 3 && enemy.attackTimer <= 0) {
            enemy.attackTimer = 3;
            enemy.droneSwarm.forEach((head) => {
                const from = { x: enemy.x + Math.cos(head.angle) * 70, y: enemy.y + Math.sin(head.angle) * 70 };
                for (let k = 0; k < 6; k += 1) {
                    bossShot(enemy, (Math.PI / 3) * k + state.time, { speed: 190, damage: 10, from, curve: 0.5, color: "#5dffa8" });
                }
            });
        }
    } else if (behavior === "bossPrism") {
        // Prisme : lasers annoncés par une ligne fine, qui tournent en phase 2+.
        const cx = canvas.width / 2 + Math.cos(state.time * 0.4) * canvas.width * 0.18;
        const cy = canvas.height / 2 + Math.sin(state.time * 0.55) * canvas.height * 0.15;
        const tx = cx - enemy.x;
        const ty = cy - enemy.y;
        const td = Math.hypot(tx, ty) || 1;
        enemy.x += (tx / td) * Math.min(td, enemy.speed * dt);
        enemy.y += (ty / td) * Math.min(td, enemy.speed * dt);
        if (enemy.beams.length === 0 && enemy.attackTimer <= 0) {
            const aim = Math.atan2(dy, dx);
            const count = enemy.phase === 1 ? 2 : enemy.phase === 2 ? 4 : 6;
            const spin = enemy.phase === 1 ? 0 : (Math.random() < 0.5 ? -1 : 1) * (0.35 + enemy.phase * 0.1);
            for (let k = 0; k < count; k += 1) {
                const angle = enemy.phase === 1 ? aim + (k === 0 ? 0 : 0.5) : aim + ((Math.PI * 2) / count) * k + 0.25;
                enemy.beams.push({ angle, spin, warn: 1.0, fire: 0.6 + enemy.phase * 0.4, width: 16 });
            }
            enemy.attackTimer = 3.6;
            play("boss");
        }
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 1200 / rage;
            const a = leadAngle(enemy, 320);
            [-0.2, -0.07, 0.07, 0.2].forEach((o) => bossShot(enemy, a + o, { speed: 320, damage: 11, color: "#ffe45e" }));
        }
    } else if (behavior === "bossQueen") {
        // Reine Essaim : reste à distance, pond des frelons et tire des orbes à tête chercheuse.
        const want = 360;
        const moveDir = dist > want ? 1 : dist < want - 80 ? -1 : 0;
        enemy.orbit = (enemy.orbit || 0) + dt * 0.8;
        enemy.x += ((dx / dist) * moveDir + Math.cos(enemy.orbit) * 0.5) * enemy.speed * dt;
        enemy.y += ((dy / dist) * moveDir + Math.sin(enemy.orbit) * 0.5) * enemy.speed * dt;
        if (enemy.attackTimer <= 0) {
            enemy.attackTimer = 3.4;
            const swarm = enemies.filter((e) => e.isMinion).length;
            const brood = Math.min(1 + enemy.phase, 10 - swarm);
            for (let k = 0; k < brood; k += 1) spawnMinion(enemy, "hornet");
        }
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 1500 / rage;
            const a = Math.atan2(dy, dx);
            const orbs = 1 + enemy.phase;
            for (let k = 0; k < orbs; k += 1) {
                bossShot(enemy, a + (k - (orbs - 1) / 2) * 0.6, {
                    speed: 150, damage: 13, radius: 8, homing: 1.4, maxLife: 4.2, color: "#ff2bd6",
                });
            }
            if (enemy.phase >= 3) bossRing(enemy, 14, Math.random() * Math.PI, { speed: 200, damage: 10 });
        }
    } else if (behavior === "bossBastion") {
        // Bastion : bouclier frontal (il faut le contourner), anneaux à trou.
        enemy.x += (dx / dist) * enemy.speed * 0.6 * dt;
        enemy.y += (dy / dist) * enemy.speed * 0.6 * dt;
        // Le bouclier surchauffe régulièrement : fenêtre pour frapper de face.
        enemy.shieldCycle = (enemy.shieldCycle || 0) + dt;
        const cycle = 7 - enemy.phase * 0.5;
        const downTime = 2.4 - enemy.phase * 0.3;
        const shieldDown = enemy.shieldCycle % cycle > cycle - downTime;
        if (shieldDown && !enemy.wasDown) floatText(enemy.x, enemy.y - enemy.size - 20, "BOUCLIER HS", "#ffffff", 10);
        enemy.wasDown = shieldDown;
        enemy.shieldArc = shieldDown ? 0 : 2.3 + enemy.phase * 0.15;
        const toPlayer = Math.atan2(dy, dx);
        if (enemy.shieldAngle === undefined) enemy.shieldAngle = toPlayer;
        const diff = Math.atan2(Math.sin(toPlayer - enemy.shieldAngle), Math.cos(toPlayer - enemy.shieldAngle));
        // Plus lent qu'un joueur qui tourne autour : on peut le contourner.
        const turn = (0.4 + enemy.phase * 0.1) * dt;
        enemy.shieldAngle += Math.max(-turn, Math.min(turn, diff));
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2300 / rage;
            const count = 22 + enemy.density * 2;
            const gapCenter = toPlayer + (Math.random() - 0.5) * 1.2;
            const gapHalf = 0.42;
            for (let k = 0; k < count; k += 1) {
                const a = (Math.PI * 2 * k) / count;
                const off = Math.atan2(Math.sin(a - gapCenter), Math.cos(a - gapCenter));
                if (Math.abs(off) < gapHalf) continue;
                bossShot(enemy, a, { speed: 170, damage: 13, radius: 7, color: "#7d9bff" });
            }
        }
        if (enemy.attackTimer <= 0) {
            enemy.attackTimer = 1.8;
            bossShot(enemy, leadAngle(enemy, 280), { speed: 280, damage: 22, radius: 13, color: "#7d9bff" });
        }
    } else if (behavior === "bossOmega") {
        // Oméga : boss final, cumule anneaux, lasers puis gravité.
        enemy.x += (dx / dist) * enemy.speed * 0.4 * dt;
        enemy.y += (dy / dist) * enemy.speed * 0.4 * dt;
        enemy.spin = (enemy.spin || 0) + dt * 1.4;
        if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 1700 / rage;
            bossRing(enemy, 14 + enemy.density, enemy.spin, { speed: 200, damage: 13, radius: 7 });
            const a = leadAngle(enemy, 360);
            [-0.1, 0, 0.1].forEach((o) => bossShot(enemy, a + o, { speed: 360, damage: 14 }));
        }
        if (enemy.phase >= 2 && enemy.beams.length === 0 && enemy.attackTimer <= 0) {
            const base = Math.atan2(dy, dx) + Math.PI / 3;
            for (let k = 0; k < 3; k += 1) {
                enemy.beams.push({ angle: base + ((Math.PI * 2) / 3) * k, spin: 0.45, warn: 1.1, fire: 2.2, width: 18 });
            }
            enemy.attackTimer = 5;
        }
        if (enemy.phase >= 3) {
            // Attraction : on est aspiré vers le cœur
            enemy.gravity = 95;
            player.x -= (dx / dist) * enemy.gravity * dt;
            player.y -= (dy / dist) * enemy.gravity * dt;
            enemy.orbTimer = (enemy.orbTimer || 0) - dt;
            if (enemy.orbTimer <= 0) {
                enemy.orbTimer = 2.2;
                for (let k = 0; k < 3; k += 1) {
                    bossShot(enemy, enemy.spin + ((Math.PI * 2) / 3) * k, {
                        speed: 160, damage: 12, radius: 8, homing: 1.2, maxLife: 4, color: "#ff2bd6",
                    });
                }
            }
        }
    } else if (behavior === "bossBlackPrism") {
        updateBlackPrism(enemy, dx, dy, dt, rage);
    }
    updateBeams(enemy, dt);
}

// Prisme Noir : le Prisme en furie, seul dans son arène. Il enchaîne
// rosaces, tenailles et grilles de lasers ; en fureur, deux éclats
// satellites balaient l'arène sans arrêt.
function updateBlackPrism(enemy, dx, dy, dt, rage) {
    const w = canvas.width;
    const h = canvas.height;
    const tx = w / 2 + Math.cos(state.time * 0.5) * w * 0.22;
    const ty = h / 2 + Math.sin(state.time * 0.8) * h * 0.18;
    const mx = tx - enemy.x;
    const my = ty - enemy.y;
    const md = Math.hypot(mx, my) || 1;
    enemy.x += (mx / md) * Math.min(md, enemy.speed * dt);
    enemy.y += (my / md) * Math.min(md, enemy.speed * dt);

    const mainBeams = enemy.beams.filter((b) => !b.orbit);
    if (mainBeams.length === 0 && enemy.attackTimer <= 0) {
        const patterns = ["rosace", "tenaille", "grille"];
        enemy.pattern = ((enemy.pattern ?? -1) + 1) % patterns.length;
        const kind = patterns[enemy.pattern];
        const aim = Math.atan2(dy, dx);
        if (kind === "rosace") {
            // Rosace : 6 / 8 / 10 lasers qui tournent (et s'inversent en phase 2+)
            const count = 4 + enemy.phase * 2;
            const spin = (Math.random() < 0.5 ? -1 : 1) * (0.55 + enemy.phase * 0.12);
            for (let k = 0; k < count; k += 1) {
                enemy.beams.push({
                    angle: aim + Math.PI / count + ((Math.PI * 2) / count) * k,
                    spin,
                    warn: 0.9,
                    fire: 2.2 + enemy.phase * 0.3,
                    width: 15,
                    hue: (360 / count) * k,
                    loud: k === 0,
                    flipAt: enemy.phase >= 2 ? 1.1 : 0,
                });
            }
            enemy.attackTimer = 1.4;
        } else if (kind === "tenaille") {
            // Tenaille : des paires de lasers qui se referment sur le joueur
            const pairs = enemy.phase >= 2 ? 2 : 1;
            for (let p = 0; p < pairs; p += 1) {
                const open = 1.3 + p * 0.5;
                const speed = 1.15 + p * 0.25;
                const fire = open / speed + 0.5;
                enemy.beams.push({ angle: aim - open, spin: speed, warn: 0.75, fire, width: 14, hue: 300 + p * 40, loud: p === 0 });
                enemy.beams.push({ angle: aim + open, spin: -speed, warn: 0.75, fire, width: 14, hue: 180 + p * 40 });
            }
            // + une salve de diamants visée pendant que ça se referme
            const a = leadAngle(enemy, 360);
            for (let k = -2; k <= 2; k += 1) bossShot(enemy, a + k * 0.12, { speed: 360, damage: 12, color: "#ffffff" });
            enemy.attackTimer = 1.2;
        } else {
            // Grille : lasers verticaux (puis horizontaux) depuis les bords, avec un trou
            const cols = 7;
            const gap = Math.floor(Math.random() * cols);
            for (let k = 0; k < cols; k += 1) {
                if (k === gap) continue;
                const x = (w / cols) * (k + 0.5);
                enemy.beams.push({ ox: x, oy: -10, angle: Math.PI / 2, spin: 0, warn: 1.0, fire: 0.7, width: 22, hue: k * 50, len: h + 40, loud: k === 0 });
            }
            if (enemy.phase >= 3) {
                const rows = 5;
                const gapRow = Math.floor(Math.random() * rows);
                for (let k = 0; k < rows; k += 1) {
                    if (k === gapRow) continue;
                    const y = (h / rows) * (k + 0.5);
                    enemy.beams.push({ ox: -10, oy: y, angle: 0, spin: 0, warn: 1.6, fire: 0.7, width: 22, hue: 200 + k * 30, len: w + 40 });
                }
            }
            enemy.attackTimer = 1.0;
        }
    }

    // En fureur : deux éclats satellites qui balaient sans arrêt.
    if (enemy.phase >= 3 && !enemy.beams.some((b) => b.orbit)) {
        for (let k = 0; k < 2; k += 1) {
            enemy.beams.push({
                orbit: { r: 190, a: Math.PI * k, speed: 0.9 },
                angle: Math.PI * k + Math.PI / 2,
                spin: -0.8,
                warn: 1.2,
                fire: 9999,
                width: 9,
                hue: 120 + k * 180,
                len: 900,
            });
        }
    }

    // Anneaux de diamants arc-en-ciel entre deux motifs
    if (enemy.shootTimer <= 0) {
        enemy.shootTimer = 1400 / rage;
        enemy.spin = (enemy.spin || 0) + 0.35;
        const count = 10 + enemy.phase * 2;
        for (let k = 0; k < count; k += 1) {
            bossShot(enemy, enemy.spin + ((Math.PI * 2) / count) * k, {
                speed: 190,
                damage: 11,
                color: `hsl(${(360 / count) * k}, 100%, 65%)`,
            });
        }
    }
}

// Lasers : avertissement (ligne fine) puis rayon qui brûle tant qu'on est dedans.
function beamOrigin(enemy, beam) {
    if (beam.orbit) {
        return {
            x: enemy.x + Math.cos(beam.orbit.a) * beam.orbit.r,
            y: enemy.y + Math.sin(beam.orbit.a) * beam.orbit.r,
        };
    }
    if (beam.ox !== undefined) return { x: beam.ox, y: beam.oy };
    return { x: enemy.x, y: enemy.y };
}

function updateBeams(enemy, dt) {
    if (!enemy.beams || enemy.beams.length === 0) return;
    for (let i = enemy.beams.length - 1; i >= 0; i -= 1) {
        const beam = enemy.beams[i];
        if (beam.orbit) beam.orbit.a += beam.orbit.speed * dt;
        if (beam.warn > 0) {
            beam.warn -= dt;
            if (beam.warn <= 0 && beam.loud) {
                shake(6);
                play("hit", 80);
            }
            continue;
        }
        beam.fire -= dt;
        beam.age = (beam.age || 0) + dt;
        // Le Prisme Noir inverse parfois la rotation en plein tir.
        if (beam.flipAt && beam.age >= beam.flipAt) {
            beam.spin = -beam.spin * 1.3;
            beam.flipAt = 0;
        }
        beam.angle += beam.spin * dt;
        if (beam.fire <= 0) {
            enemy.beams.splice(i, 1);
            continue;
        }
        const o = beamOrigin(enemy, beam);
        const px = player.x - o.x;
        const py = player.y - o.y;
        const along = px * Math.cos(beam.angle) + py * Math.sin(beam.angle);
        const perp = Math.abs(-px * Math.sin(beam.angle) + py * Math.cos(beam.angle));
        if (along > 0 && along < (beam.len || Infinity) && perp < beam.width + player.radius * 0.7) {
            applyPlayerDamage(60 * enemy.bulletDamage * (enemy.beamFactor || 1) * dt, { feedback: false });
            if (Math.random() < dt * 8) {
                burst(player.x, player.y, beamColor(enemy, beam), 4, 160, 2);
                shake(2);
            }
        }
    }
}

// Couleur d'un laser : arc-en-ciel pour le Prisme Noir.
function beamColor(enemy, beam) {
    if (!enemy.rainbow) return enemy.color;
    const hue = (state.time * 140 + (beam.hue || 0)) % 360;
    return `hsl(${hue}, 100%, 62%)`;
}

// Bouclier du Bastion : bloque les tirs qui arrivent de face.
function bastionBlocks(enemy, p) {
    const a = Math.atan2(p.y - enemy.y, p.x - enemy.x);
    const diff = Math.atan2(Math.sin(a - enemy.shieldAngle), Math.cos(a - enemy.shieldAngle));
    if (Math.abs(diff) > enemy.shieldArc / 2) return false;
    burst(p.x, p.y, enemy.color, 3, 140, 2);
    // En fureur, le bouclier renvoie une partie des tirs.
    if (enemy.phase >= 3 && Math.random() < 0.25 && enemyProjectiles.length < 160) {
        bossShot(enemy, Math.atan2(player.y - p.y, player.x - p.x), { from: p, speed: 260, damage: 9, color: "#7d9bff" });
    }
    return true;
}

const minionTemplates = {
    hornet: { name: "Frelon", shape: "triangle", color: "#ff78c9", size: 13, health: 18, xp: 4, speed: 230, behavior: "rusher" },
};

function spawnMinion(parent, key) {
    const t = minionTemplates[key];
    const angle = Math.random() * Math.PI * 2;
    const health = t.health * getDifficultyConfig().enemyHealthMultiplier * sectorHealthMult() * (1 + state.level * 0.03);
    enemies.push({
        ...t,
        x: parent.x + Math.cos(angle) * parent.size,
        y: parent.y + Math.sin(angle) * parent.size,
        health,
        currentHealth: health,
        speed: t.speed * sectorSpeedMult(),
        isMinion: true,
        shootTimer: 0,
        visualAngle: 0,
        hitFlash: 0,
        spawnAnim: 0,
    });
}

function updateEnemies(dt) {
    updateSpawning(dt);

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];
        if (!enemy) continue;
        enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt);
        enemy.spawnAnim = Math.min(1, (enemy.spawnAnim || 0) + dt * 3);

        enemy.shootTimer = (enemy.shootTimer || 0) - dt * 1000;
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.hypot(dx, dy) || 0.0001;
        const behavior = enemy.behavior || "default";

        if (behavior === "dodger") {
            const threat = projectiles.find((p) => {
                const distToProj = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (distToProj > 180) return false;
                // Le projectile se dirige-t-il vers l'ennemi ?
                const toEnemy = Math.atan2(enemy.y - p.y, enemy.x - p.x);
                const projDir = Math.atan2(p.vy, p.vx);
                const diff = Math.abs(Math.atan2(Math.sin(projDir - toEnemy), Math.cos(projDir - toEnemy)));
                return diff < Math.PI / 5;
            });
            const closeToPlayer = dist < 160;
            if (threat && !closeToPlayer) {
                const perp = [-threat.vy, threat.vx];
                const len = Math.hypot(perp[0], perp[1]) || 1;
                enemy.x += (perp[0] / len) * enemy.speed * dt;
                enemy.y += (perp[1] / len) * enemy.speed * dt;
            } else {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        } else if (behavior === "rusher") {
            const burstMult = dist > 200 ? 1.6 : 1;
            enemy.x += (dx / dist) * enemy.speed * burstMult * dt;
            enemy.y += (dy / dist) * enemy.speed * burstMult * dt;
        } else if (behavior === "shooterSingle") {
            const desired = 320;
            const moveDir = dist > desired ? 1 : dist < desired * 0.6 ? -1 : 0;
            enemy.x += (dx / dist || 0) * enemy.speed * 0.9 * moveDir * dt;
            enemy.y += (dy / dist || 0) * enemy.speed * 0.9 * moveDir * dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 1050;
                const angle = Math.atan2(dy, dx);
                spawnEnemyProjectile(enemy, angle, { speed: 260, damage: 12 });
            }
        } else if (behavior === "shooterDouble") {
            const desired = 360;
            const moveDir = dist > desired ? 1 : dist < desired * 0.65 ? -1 : 0;
            enemy.x += (dx / dist || 0) * enemy.speed * moveDir * dt;
            enemy.y += (dy / dist || 0) * enemy.speed * moveDir * dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 1250;
                const angle = Math.atan2(dy, dx);
                const spread = 0.18;
                spawnEnemyProjectile(enemy, angle - spread, { speed: 270, damage: 11 });
                spawnEnemyProjectile(enemy, angle + spread, { speed: 270, damage: 11 });
            }
        } else if (behavior === "laserMob") {
            // Se place à distance, s'immobilise, prévient puis tire son laser.
            const busy = enemy.beams.length > 0;
            if (!busy) {
                const desired = 320;
                const moveDir = dist > desired ? 1 : dist < desired * 0.7 ? -1 : 0;
                enemy.x += (dx / dist) * enemy.speed * moveDir * dt;
                enemy.y += (dy / dist) * enemy.speed * moveDir * dt;
                enemy.laserTimer -= dt;
            }
            if (!busy && enemy.laserTimer <= 0 && dist < 650) {
                enemy.laserTimer = 3 + Math.random() * 1.5;
                const aim = Math.atan2(dy, dx);
                if (enemy.beamCount === 1) {
                    enemy.beams.push({ angle: aim, spin: 0, warn: 0.9, fire: 0.45, width: 7, len: 700 });
                } else {
                    const spin = Math.random() < 0.5 ? -0.7 : 0.7;
                    for (let k = 0; k < enemy.beamCount; k += 1) {
                        enemy.beams.push({
                            angle: aim + ((Math.PI * 2) / enemy.beamCount) * k - spin * 0.4,
                            spin, warn: 1.0, fire: 1.1, width: 7, len: 520,
                        });
                    }
                }
            }
            updateBeams(enemy, dt);
        } else if (behavior === "shooterSix") {
            const desired = 420;
            const moveDir = dist > desired ? 1 : dist < desired * 0.7 ? -1 : 0;
            enemy.x += (dx / dist || 0) * enemy.speed * 0.9 * moveDir * dt;
            enemy.y += (dy / dist || 0) * enemy.speed * 0.9 * moveDir * dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 1550;
                const angle = Math.atan2(dy, dx);
                const spread = Math.PI / 1.3;
                for (let k = 0; k < 6; k += 1) {
                    const a = angle - spread / 2 + (spread / 5) * k;
                    spawnEnemyProjectile(enemy, a, { speed: 280, damage: 9 });
                }
            }
        } else if (behavior.startsWith("boss")) {
            updateBoss(enemy, behavior, dx, dy, dist, dt);
        } else {
            const chaseStep = Math.min(dist, (enemy.speed || 60) * dt);
            enemy.x += (dx / dist) * chaseStep;
            enemy.y += (dy / dist) * chaseStep;
        }

        // Séparation légère entre ennemis pour éviter qu'ils se superposent
        for (let k = 0; k < i; k += 1) {
            const other = enemies[k];
            const ox = enemy.x - other.x;
            const oy = enemy.y - other.y;
            const minSep = (enemy.size + other.size) * 0.9;
            const d2 = ox * ox + oy * oy;
            if (d2 > 0 && d2 < minSep * minSep) {
                const d = Math.sqrt(d2);
                const push = (minSep - d) * 0.5;
                const wA = enemy.isBoss ? 0.1 : 1;
                const wB = other.isBoss ? 0.1 : 1;
                enemy.x += (ox / d) * push * wA;
                enemy.y += (oy / d) * push * wA;
                other.x -= (ox / d) * push * wB;
                other.y -= (oy / d) * push * wB;
            }
        }

        enemy.x = Math.max(enemy.size, Math.min(canvas.width - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(canvas.height - enemy.size, enemy.y));

        dx = player.x - enemy.x;
        dy = player.y - enemy.y;
        dist = Math.hypot(dx, dy) || 0.0001;
        enemy.visualAngle = Math.atan2(dy, dx);
        const minDist = player.radius + enemy.size;
        if (dist < minDist) {
            const safeDist = dist || 0.0001;
            const overlap = minDist - dist;
            const nx = dx / safeDist;
            const ny = dy / safeDist;
            enemy.x -= nx * overlap * 0.3;
            enemy.y -= ny * overlap * 0.3;
            player.x += nx * overlap * 0.1;
            player.y += ny * overlap * 0.1;
            const contactDamage = enemy.isBoss
                ? 30 + state.sectorIndex * 3
                : (behavior === "rusher" ? 14 : 8) * sectorDamageMult();
            applyPlayerDamage(contactDamage * dt, { feedback: false });
            if (state.invulnerable <= 0) {
                play("hurt", 350);
                shake(3);
                flash("255,59,107", 0.12);
            }
        }

        for (let j = projectiles.length - 1; j >= 0; j -= 1) {
            const p = projectiles[j];
            if (p.hit.has(enemy)) continue;
            const distToProjectile = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (enemy.shieldArc && distToProjectile < enemy.size + 30 + p.radius && bastionBlocks(enemy, p)) {
                projectiles.splice(j, 1);
                continue;
            }
            if (distToProjectile < enemy.size + p.radius) {
                // Chaque projectile ne touche une même cible qu'une fois
                // (avant : la perforation re-touchait l'ennemi à chaque image).
                p.hit.add(enemy);
                const push = 4 + upgrades.impact.level * 5;
                const len = Math.hypot(p.vx, p.vy) || 1;
                burst(p.x, p.y, enemy.color, 4, 160, 2);
                if (p.pierce && p.pierce > 0) {
                    p.pierce -= 1;
                } else {
                    projectiles.splice(j, 1);
                }
                damageEnemy(enemy, p.damage, { x: (p.vx / len) * push, y: (p.vy / len) * push });
                if (enemy.dead) break;
            }
        }
    }

    if (player.health <= 0) {
        handlePlayerDeath();
    }
}

function updateCombo(dt) {
    if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) state.combo = 0;
    }
}

const ARENA_INTRO = 4.6;

function updateSectorFlow(dt) {
    state.phaseTime += dt;
    if (state.sectorPhase === "intro" && getSector().arena) {
        if (state.phaseTime >= ARENA_INTRO) {
            state.phaseTime = 0;
            startBossPhase();
            shake(20);
            flash("255,255,255", 0.8);
        }
    } else if (state.sectorPhase === "intro" && state.phaseTime >= 2.4) {
        state.sectorPhase = "fight";
        state.phaseTime = 0;
        // Quelques ennemis d'entrée pour lancer l'action
        for (let i = 0; i < 2; i += 1) spawnEnemy();
    } else if (state.sectorPhase === "portal" && state.portal) {
        const portal = state.portal;
        portal.r += (portal.targetR - portal.r) * Math.min(1, dt * 4);
        if (Math.random() < 0.6) {
            const a = Math.random() * Math.PI * 2;
            particles.push({
                x: portal.x + Math.cos(a) * portal.r * 1.6,
                y: portal.y + Math.sin(a) * portal.r * 1.6,
                vx: -Math.cos(a) * 90,
                vy: -Math.sin(a) * 90,
                life: 0,
                max: 0.5,
                color: Math.random() < 0.5 ? "#2de2ff" : "#ff2bd6",
                size: 2.5,
            });
        }
        if (Math.hypot(player.x - portal.x, player.y - portal.y) < portal.r + player.radius * 0.5) {
            state.sectorPhase = "exit";
            state.phaseTime = 0;
            play("sector");
            flash("45,226,255", 0.5);
            state.score += 1000 * (state.sectorIndex + 1);
            floatText(portal.x, portal.y - 60, `SECTEUR +${1000 * (state.sectorIndex + 1)}`, "#2de2ff", 12);
        }
    } else if (state.sectorPhase === "exit") {
        // Le joueur est aspiré dans le portail
        const portal = state.portal;
        const t = Math.min(1, state.phaseTime / 1.1);
        player.x += (portal.x - player.x) * Math.min(1, dt * 8);
        player.y += (portal.y - player.y) * Math.min(1, dt * 8);
        player.vx = 0;
        player.vy = 0;
        player.exitScale = 1 - t;
        if (state.phaseTime >= 1.1) {
            player.exitScale = 0;
            if (state.challenge) {
                recordBest();
                returnToMenu();
                return;
            }
            state.sectorPhase = "cards";
            state.phaseTime = 0;
            showCardOverlay();
        }
    }
}

// ---------------------------------------------------------------------------
// Rendu néon
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
}

function buildArenaBackground() {
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const g = off.getContext("2d");
    const sector = getSector();
    const grad = g.createRadialGradient(
        off.width / 2, off.height * 0.55, 0,
        off.width / 2, off.height * 0.55, Math.max(off.width, off.height) * 0.75
    );
    grad.addColorStop(0, "#1a0935");
    grad.addColorStop(0.6, "#0d0420");
    grad.addColorStop(1, "#05010c");
    g.fillStyle = grad;
    g.fillRect(0, 0, off.width, off.height);
    drawArenaGrid(g, off.width, off.height, sector, 1);
    return off;
}

// Grille néon ; `progress` < 1 pendant l'animation de construction du secteur.
function drawArenaGrid(g, width, height, sector, progress) {
    const spacing = 48;
    const cx = width / 2;
    const cy = height / 2;
    const rgb = hexToRgb(sector.hue);
    g.save();
    g.lineWidth = 1;
    const maxReach = Math.hypot(cx, cy);
    for (let x = cx % spacing; x < width; x += spacing) {
        const delay = Math.abs(x - cx) / cx;
        const p = Math.max(0, Math.min(1, progress * 1.6 - delay * 0.6));
        if (p <= 0) continue;
        const half = (height / 2) * p;
        g.strokeStyle = `rgba(${rgb},${0.08 + 0.12 * (1 - p)})`;
        g.beginPath();
        g.moveTo(x + 0.5, cy - half);
        g.lineTo(x + 0.5, cy + half);
        g.stroke();
    }
    for (let y = cy % spacing; y < height; y += spacing) {
        const delay = Math.abs(y - cy) / cy;
        const p = Math.max(0, Math.min(1, progress * 1.6 - delay * 0.6));
        if (p <= 0) continue;
        const half = (width / 2) * p;
        g.strokeStyle = `rgba(${rgb},${0.08 + 0.12 * (1 - p)})`;
        g.beginPath();
        g.moveTo(cx - half, y + 0.5);
        g.lineTo(cx + half, y + 0.5);
        g.stroke();
    }
    // Cadre néon
    const frame = Math.min(1, progress * 1.2);
    if (frame > 0) {
        g.strokeStyle = sector.accent;
        g.shadowColor = sector.accent;
        g.shadowBlur = 16;
        g.lineWidth = 3;
        g.globalAlpha = frame;
        g.strokeRect(6, 6, width - 12, height - 12);
    }
    g.restore();
    return maxReach;
}

function drawArena() {
    const building = state.phase === "playing" && state.sectorPhase === "intro" && state.phaseTime < 1.4;
    if (building) {
        const g = ctx;
        g.fillStyle = "#07020f";
        g.fillRect(0, 0, canvas.width, canvas.height);
        const p = state.phaseTime / 1.4;
        const eased = 1 - Math.pow(1 - p, 3);
        g.save();
        g.globalAlpha = eased;
        if (!arenaBackground) arenaBackground = buildArenaBackground();
        g.drawImage(arenaBackground, 0, 0);
        g.restore();
        g.fillStyle = `rgba(7,2,15,${0.9 * (1 - eased)})`;
        g.fillRect(0, 0, canvas.width, canvas.height);
        drawArenaGrid(g, canvas.width, canvas.height, getSector(), eased);
        return;
    }
    if (!arenaBackground) arenaBackground = buildArenaBackground();
    ctx.drawImage(arenaBackground, 0, 0);
}

function polygonPath(g, sides, radius, rotation = 0) {
    g.beginPath();
    for (let i = 0; i < sides; i += 1) {
        const angle = rotation + (Math.PI * 2 * i) / sides;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
    }
    g.closePath();
}

function drawPlayer() {
    if (state.phase === "gameover") return;
    if (state.invulnerable > 0 && Math.floor(state.invulnerable * 12) % 2 === 0) return;
    const skin = playerSkins[currentSkinIndex];
    const scale = player.exitScale ?? 1;
    if (scale <= 0.01) return;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(scale, scale);
    ctx.rotate(player.angle);

    const hasSniper = player.selectedClasses.includes("sniper");
    const hasDestroyer = player.selectedClasses.includes("destroyer");
    const recoil = (player.recoil || 0) * 5;
    const cannonLength = (player.radius + 20) * (hasSniper ? 1.3 : 1) - recoil;
    const cannonWidth = 14 * (hasDestroyer ? 1.4 : 1);
    const cannonCount =
        Math.min(
            8,
            1 +
                playerModifiers.cannonBonusShots +
                playerModifiers.tankBonusShots +
                playerModifiers.extraShotCount +
                upgrades.multiShot.level
        ) || 1;
    const spreadVisual = 0.1;
    const offsetStart = -((cannonCount - 1) * spreadVisual) / 2;

    ctx.lineWidth = 3;
    ctx.shadowBlur = 16;

    // Canons de l'Octo Tank
    if (playerModifiers.octoRadial) {
        ctx.strokeStyle = skin.cannon;
        ctx.shadowColor = skin.cannon;
        ctx.fillStyle = "rgba(10,4,24,0.9)";
        const spin = state.time * 0.4 - player.angle;
        for (let i = 0; i < 8; i += 1) {
            ctx.save();
            ctx.rotate(spin + (Math.PI * 2 * i) / 8);
            ctx.fillRect(0, -5, player.radius + 10, 10);
            ctx.strokeRect(0, -5, player.radius + 10, 10);
            ctx.restore();
        }
    }

    // Canons
    ctx.strokeStyle = skin.cannon;
    ctx.shadowColor = skin.cannon;
    ctx.fillStyle = "rgba(10,4,24,0.9)";
    for (let i = 0; i < cannonCount; i += 1) {
        const offset = offsetStart + spreadVisual * i;
        ctx.save();
        ctx.rotate(offset);
        ctx.fillRect(0, -cannonWidth / 2, cannonLength, cannonWidth);
        ctx.strokeRect(0, -cannonWidth / 2, cannonLength, cannonWidth);
        ctx.restore();
    }

    // Corps
    ctx.strokeStyle = skin.body;
    ctx.shadowColor = skin.body;
    ctx.fillStyle = `rgba(${hexToRgb(skin.body)},0.22)`;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.body;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Réticule de visée
    if (!state.trackpadMode && mouse.active && state.phase === "playing") {
        ctx.save();
        ctx.strokeStyle = "rgba(45,226,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
        ctx.moveTo(mouse.x - 14, mouse.y);
        ctx.lineTo(mouse.x - 5, mouse.y);
        ctx.moveTo(mouse.x + 5, mouse.y);
        ctx.lineTo(mouse.x + 14, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 14);
        ctx.lineTo(mouse.x, mouse.y - 5);
        ctx.moveTo(mouse.x, mouse.y + 5);
        ctx.lineTo(mouse.x, mouse.y + 14);
        ctx.stroke();
        ctx.restore();
    }
}

function drawDrones() {
    if (drones.length === 0) return;
    ctx.save();
    ctx.strokeStyle = "#ffe45e";
    ctx.fillStyle = "rgba(255,228,94,0.25)";
    ctx.shadowColor = "#ffe45e";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    drones.forEach((drone) => {
        ctx.save();
        ctx.translate(drone.x, drone.y);
        polygonPath(ctx, 3, 10, drone.angle * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
    ctx.restore();
}

function drawProjectiles() {
    const defaultColor = playerSkins[currentSkinIndex].body;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    projectiles.forEach((p) => {
        const color = p.color || defaultColor;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = p.radius * 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawEnemyProjectiles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    enemyProjectiles.forEach((p) => {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = p.color || "#ff3b6b";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffd0dc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function traceEnemyShape(enemy, size) {
    const facing = (enemy.visualAngle || 0) + Math.PI / 2;
    switch (enemy.shape) {
        case "square":
            ctx.beginPath();
            ctx.rect(-size, -size, size * 2, size * 2);
            break;
        case "triangle":
            ctx.rotate(facing);
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size, size);
            ctx.lineTo(-size, size);
            ctx.closePath();
            break;
        case "pentagon":
            polygonPath(ctx, 5, size, -Math.PI / 2);
            break;
        case "diamond":
            ctx.rotate(facing / 2);
            polygonPath(ctx, 4, size, 0);
            break;
        case "hex":
            polygonPath(ctx, 6, size, enemy.isBoss ? state.time * 0.3 : 0);
            break;
        case "octagon":
            ctx.rotate(facing / 2);
            polygonPath(ctx, 8, size, 0);
            break;
        case "circle":
        default:
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            break;
    }
}

// Signaux d'attaque : le joueur voit venir la charge et la téléportation.
function drawBossTelegraphs(enemy) {
    const atk = enemy.attackState;
    ctx.save();
    if (enemy.phaseShield > 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.shadowColor = "#ff3b6b";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(state.time * 30);
        polygonPath(ctx, 6, enemy.size + 26, state.time * 2);
        ctx.stroke();
    }
    if (atk && atk.type === "windup") {
        const blink = Math.sin(state.time * 40) > 0;
        ctx.strokeStyle = "#ff3b6b";
        ctx.shadowColor = "#ff3b6b";
        ctx.shadowBlur = 16;
        ctx.lineWidth = blink ? 5 : 2;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([18, 10]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(atk.angle) * 520, Math.sin(atk.angle) * 520);
        ctx.stroke();
    }
    ctx.restore();
    drawBossSpecials(enemy);
    ctx.save();
    if (atk && atk.type === "blink") {
        ctx.strokeStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(atk.x - enemy.x, atk.y - enemy.y, enemy.size * (0.6 + atk.t), 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

// Lasers, bouclier et puits de gravité (repère centré sur le boss).
function drawBossSpecials(enemy) {
    (enemy.beams || []).forEach((beam) => {
        const len = beam.len || Math.hypot(canvas.width, canvas.height) * 1.2;
        const o = beamOrigin(enemy, beam);
        const sx = o.x - enemy.x;
        const sy = o.y - enemy.y;
        const ex = sx + Math.cos(beam.angle) * len;
        const ey = sy + Math.sin(beam.angle) * len;
        const color = beamColor(enemy, beam);
        ctx.save();
        if (beam.orbit) {
            // Éclat satellite qui émet le laser
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 18;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(state.time * 4);
            polygonPath(ctx, 4, 12, 0);
            ctx.fill();
            ctx.restore();
        }
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        if (beam.warn > 0) {
            ctx.globalAlpha = 0.35 + 0.35 * Math.sin(state.time * 30);
            ctx.lineWidth = 2;
            ctx.setLineDash([14, 10]);
            ctx.shadowBlur = 10;
            ctx.stroke();
        } else {
            ctx.globalCompositeOperation = "lighter";
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = beam.width * 2;
            ctx.stroke();
            ctx.globalAlpha = 0.95;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = beam.width * 0.6;
            ctx.stroke();
        }
        ctx.restore();
    });
    if (enemy.shieldArc && enemy.shieldAngle !== undefined) {
        ctx.save();
        ctx.strokeStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 22;
        ctx.lineWidth = 7;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size + 22, enemy.shieldAngle - enemy.shieldArc / 2, enemy.shieldAngle + enemy.shieldArc / 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();
    }
    if (enemy.gravity) {
        ctx.save();
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k += 1) {
            const t = (state.time * 0.6 + k / 3) % 1;
            ctx.globalAlpha = 0.08 + 0.3 * t;
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size + (1 - t) * 260, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawEnemies() {
    // Lasers des mobs d'abord, sous les formes
    enemies.forEach((enemy) => {
        if (enemy.isBoss || !enemy.beams || !enemy.beams.length) return;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        drawBossSpecials(enemy);
        ctx.restore();
    });
    enemies.forEach((enemy) => {
        const spawn = enemy.spawnAnim ?? 1;
        const size = enemy.size * (0.4 + 0.6 * (1 - Math.pow(1 - spawn, 3)));
        const flashing = enemy.hitFlash > 0;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.save();
        traceEnemyShape(enemy, size);
        ctx.fillStyle = flashing ? "rgba(255,255,255,0.85)" : `rgba(${hexToRgb(enemy.color)},0.18)`;
        const tint = enemy.rainbow ? `hsl(${(state.time * 140) % 360}, 100%, 65%)` : enemy.color;
        ctx.strokeStyle = flashing ? "#ffffff" : tint;
        ctx.shadowColor = tint;
        ctx.shadowBlur = enemy.isBoss ? 28 : 14;
        ctx.lineWidth = enemy.isBoss ? 4 : 2.5;
        ctx.globalAlpha = spawn;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (enemy.isBoss) {
            // Anneau tournant + drones du Spectre
            ctx.save();
            ctx.strokeStyle = enemy.color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 8]);
            ctx.rotate(state.time);
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size + 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            drawBossTelegraphs(enemy);
            if (enemy.droneSwarm) {
                ctx.save();
                ctx.fillStyle = enemy.color;
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 12;
                enemy.droneSwarm.forEach((drone) => {
                    ctx.beginPath();
                    ctx.arc(Math.cos(drone.angle) * 70, Math.sin(drone.angle) * 70, 8, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }
        } else if (enemy.currentHealth < enemy.health) {
            const w = enemy.size * 1.8;
            const ratio = Math.max(0, enemy.currentHealth / enemy.health);
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fillRect(-w / 2, enemy.size + 8, w, 4);
            ctx.fillStyle = enemy.color;
            ctx.fillRect(-w / 2, enemy.size + 8, w * ratio, 4);
        }
        ctx.restore();
    });
}

function drawMines() {
    mines.forEach((mine) => {
        const glow = 6 + Math.sin(mine.pulse) * 3;
        const blink = mine.life < 1500 && Math.floor(mine.life / 120) % 2 === 0;
        ctx.save();
        ctx.translate(mine.x, mine.y);
        ctx.strokeStyle = "#ffb35e";
        ctx.shadowColor = "#ffb35e";
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(255,179,94,0.2)";
        ctx.beginPath();
        ctx.arc(0, 0, mine.radius + glow * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = blink ? "#ffffff" : "#ffb35e";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawPickups() {
    pickups.forEach((pickup) => {
        if (pickup.life < 4 && Math.floor(pickup.life * 6) % 2 === 0) return;
        const bob = Math.sin(pickup.pulse) * 3;
        ctx.save();
        ctx.translate(pickup.x, pickup.y + bob);
        ctx.strokeStyle = pickup.type.color;
        ctx.shadowColor = pickup.type.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
        ctx.fillStyle = `rgba(${hexToRgb(pickup.type.color)},0.25)`;
        polygonPath(ctx, 4, 13, pickup.pulse * 0.5);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = `7px ${FONT}`;
        ctx.fillStyle = pickup.type.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pickup.type.label, 0, -26);
        ctx.restore();
    });
}

function drawPortal() {
    const portal = state.portal;
    if (!portal || (state.sectorPhase !== "portal" && state.sectorPhase !== "exit")) return;
    ctx.save();
    ctx.translate(portal.x, portal.y);
    for (let i = 0; i < 4; i += 1) {
        ctx.save();
        ctx.rotate(state.time * (i % 2 ? -1.5 : 2) + i);
        ctx.strokeStyle = i % 2 ? "#ff2bd6" : "#2de2ff";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.setLineDash([portal.r * 0.6, portal.r * 0.3]);
        ctx.beginPath();
        ctx.arc(0, 0, portal.r * (1 - i * 0.18), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.r);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.4, "rgba(45,226,255,0.35)");
    grad.addColorStop(1, "rgba(255,43,214,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, portal.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flèche vers le portail si le joueur est loin
    const dist = Math.hypot(portal.x - player.x, portal.y - player.y);
    if (state.sectorPhase === "portal" && dist > 160) {
        const a = Math.atan2(portal.y - player.y, portal.x - player.x);
        ctx.save();
        ctx.translate(player.x + Math.cos(a) * 60, player.y + Math.sin(a) * 60);
        ctx.rotate(a);
        ctx.fillStyle = "#2de2ff";
        ctx.shadowColor = "#2de2ff";
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.6 + Math.sin(state.time * 8) * 0.3;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -7);
        ctx.lineTo(-6, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function drawEffects() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    particles.forEach((p) => {
        const t = 1 - p.life / p.max;
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + t * 0.5);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    });
    rings.forEach((r) => {
        const t = r.life / r.dur;
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.maxR * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    floatTexts.forEach((t) => {
        const k = t.life / t.max;
        const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15));
        ctx.globalAlpha = 1 - Math.pow(k, 3);
        ctx.font = `${Math.round(t.size * pop)}px ${FONT}`;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillText(t.text, t.x + 2, t.y + 2);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 10;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.restore();
}

function drawNeonText(text, x, y, size, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Légère aberration chromatique
    ctx.fillStyle = "rgba(255,43,214,0.7)";
    ctx.fillText(text, x - 2, y);
    ctx.fillStyle = "rgba(45,226,255,0.7)";
    ctx.fillText(text, x + 2, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// Intro de l'arène : des éclats de lumière convergent et forment le Prisme Noir.
function drawArenaIntro(cx, cy) {
    const t = state.phaseTime;
    const p = Math.min(1, t / ARENA_INTRO);
    const eased = 1 - Math.pow(1 - p, 2);
    const tx = canvas.width / 2;
    const ty = canvas.height * 0.35;
    const reach = Math.hypot(canvas.width, canvas.height) * 0.7;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.35 * Math.min(1, t)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 18; k += 1) {
        const a = (Math.PI * 2 * k) / 18 + t * 0.6;
        const r = reach * (1 - eased) + 10;
        const x = tx + Math.cos(a) * r;
        const y = ty + Math.sin(a) * r;
        const color = `hsl(${(k * 20 + t * 120) % 360}, 100%, 62%)`;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.globalAlpha = 0.25 + 0.75 * p;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(a) * 60 * (1 - eased), y - Math.sin(a) * 60 * (1 - eased));
        ctx.stroke();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 5 + k);
        polygonPath(ctx, 4, 7, 0);
        ctx.stroke();
        ctx.restore();
    }
    // Cœur qui gonfle juste avant l'apparition
    if (p > 0.7) {
        const q = (p - 0.7) / 0.3;
        ctx.globalAlpha = q;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(tx, ty, 8 + q * 50, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    const alpha = t < 0.4 ? t / 0.4 : t > ARENA_INTRO - 0.5 ? Math.max(0, (ARENA_INTRO - t) / 0.5) : 1;
    const jitter = Math.random() < 0.15 ? (Math.random() - 0.5) * 8 : 0;
    drawNeonText("⚠ ARÈNE SECRÈTE ⚠", cx, cy + 40, 12, "#ff2bd6", alpha);
    drawNeonText("PRISME NOIR", cx + jitter + 3, cy + 90, Math.min(40, canvas.width / 18), "#2de2ff", alpha * 0.5);
    drawNeonText("PRISME NOIR", cx + jitter - 3, cy + 90, Math.min(40, canvas.width / 18), "#ff2bd6", alpha * 0.5);
    drawNeonText("PRISME NOIR", cx, cy + 90, Math.min(40, canvas.width / 18), "#ffffff", alpha);
    drawNeonText("Aucun renfort. Seulement lui.", cx, cy + 130, 9, "#ffe45e", alpha);
    if (state.upgradePoints > 0) {
        drawNeonText(`${state.upgradePoints} points à dépenser : touches 1 à 0`, cx, cy + 160, 8, "#5dffa8", alpha);
    }
}

function drawOverlayTexts() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const sector = getSector();

    if (state.phase === "playing" && state.sectorPhase === "intro" && sector.arena) {
        drawArenaIntro(cx, cy);
    } else if (state.phase === "playing" && state.sectorPhase === "intro") {
        const t = state.phaseTime;
        const alpha = t < 0.3 ? t / 0.3 : t > 2 ? Math.max(0, 1 - (t - 2) / 0.4) : 1;
        const slide = t < 0.4 ? (1 - t / 0.4) * 60 : 0;
        const label = sector.infinite ? "MODE INFINI" : `SECTEUR ${state.sectorIndex + 1}`;
        drawNeonText(label, cx - slide, cy - 34, 14, sector.accent, alpha);
        drawNeonText(sector.name.toUpperCase(), cx + slide, cy + 6, Math.min(34, canvas.width / 22), "#ffffff", alpha);
        drawNeonText(`Objectif : ${state.sectorGoal} ennemis`, cx, cy + 48, 9, "#ffe45e", alpha);
    }

    if (state.sectorPhase === "boss" && state.phaseTime < 2.2) {
        const boss = enemies.find((e) => e.isBoss);
        const blink = Math.floor(state.phaseTime * 6) % 2 === 0;
        if (blink) drawNeonText("⚠ ALERTE BOSS ⚠", cx, cy - 20, 20, "#ff3b6b");
        if (boss) drawNeonText(boss.name.toUpperCase(), cx, cy + 20, 12, boss.color);
    }

    if (state.sectorPhase === "portal") {
        drawNeonText("ENTRE DANS LE PORTAIL", cx, 70, 11, "#2de2ff", 0.6 + Math.sin(state.time * 5) * 0.4);
    }

    // Barre de vie du boss
    const boss = enemies.find((e) => e.isBoss);
    if (boss) {
        const w = Math.min(520, canvas.width * 0.5);
        const x = cx - w / 2;
        const y = 22;
        ctx.save();
        ctx.font = `9px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillStyle = boss.color;
        ctx.fillText(boss.name.toUpperCase(), cx, y - 6);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(x, y, w, 8);
        ctx.fillStyle = boss.color;
        ctx.shadowColor = boss.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(x, y, w * Math.max(0, boss.currentHealth / boss.health), 8);
        // Repères des phases (66 % et 33 %)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        [0.66, 0.33].forEach((r) => ctx.fillRect(x + w * r - 1, y - 2, 2, 12));
        if (boss.phase > 1) {
            ctx.fillStyle = "#ff3b6b";
            ctx.fillText(boss.phase === 3 ? "FUREUR" : "ENRAGÉ", cx, y + 22);
        }
        ctx.restore();
    }

    // Combo
    if (state.combo >= 2) {
        const mult = getComboMultiplier();
        const x = canvas.width - 20;
        ctx.save();
        ctx.textAlign = "right";
        ctx.font = `14px ${FONT}`;
        ctx.fillStyle = mult > 1 ? "#ff2bd6" : "#ffe45e";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fillText(`COMBO ${state.combo}`, x, 34);
        ctx.font = `10px ${FONT}`;
        ctx.fillText(`x${mult}`, x, 54);
        ctx.shadowBlur = 0;
        const max = 2.2 + perk("combo") * 0.8;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x - 120, 62, 120, 3);
        ctx.fillStyle = "#ff2bd6";
        ctx.fillRect(x - 120, 62, 120 * Math.max(0, state.comboTimer / max), 3);
        ctx.restore();
    }

    // Bonus actifs
    const buffs = Object.keys(buffLabels).filter((key) => isBuffActive(key));
    if (buffs.length) {
        ctx.save();
        ctx.font = `8px ${FONT}`;
        ctx.textAlign = "left";
        buffs.forEach((key, i) => {
            const info = buffLabels[key];
            const remaining = Math.max(0, activeBuffs[key] - state.time);
            ctx.fillStyle = info.color;
            ctx.shadowColor = info.color;
            ctx.shadowBlur = 8;
            ctx.fillText(`${info.label} ${remaining.toFixed(0)}s`, 20, canvas.height - 24 - i * 16);
        });
        ctx.restore();
    }

    if (state.phase === "playing" && state.paused) {
        ctx.save();
        ctx.fillStyle = "rgba(7,2,15,0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        drawNeonText("PAUSE", cx, cy - 10, 30, "#ffffff");
        drawNeonText("P / Échap pour reprendre", cx, cy + 34, 9, "#b7a6d9");
    }

    if (state.flash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(${state.flashColor},${Math.min(0.6, state.flash)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Écran titre : soleil rétro à bandes + grille en perspective
// ---------------------------------------------------------------------------

const titleStars = Array.from({ length: 90 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.55,
    s: Math.random() * 1.6 + 0.4,
    tw: Math.random() * Math.PI * 2,
}));

function drawTitleScreen(time) {
    const g = titleCtx;
    const w = titleCanvas.width;
    const h = titleCanvas.height;
    const horizon = h * 0.62;

    const sky = g.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#0b0418");
    sky.addColorStop(0.6, "#2a0a4a");
    sky.addColorStop(1, "#5c0f63");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, horizon);

    titleStars.forEach((star) => {
        g.globalAlpha = 0.4 + Math.sin(time * 2 + star.tw) * 0.3;
        g.fillStyle = "#ffffff";
        g.fillRect(star.x * w, star.y * h, star.s, star.s);
    });
    g.globalAlpha = 1;

    // Soleil
    const r = Math.min(w, h) * 0.2;
    const sx = w / 2;
    const sy = horizon - r * 0.35;
    const sun = g.createLinearGradient(0, sy - r, 0, sy + r);
    sun.addColorStop(0, "#ffe45e");
    sun.addColorStop(0.5, "#ff5fa2");
    sun.addColorStop(1, "#ff2bd6");
    g.save();
    g.shadowColor = "#ff2bd6";
    g.shadowBlur = 60;
    g.fillStyle = sun;
    g.beginPath();
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // Bandes du soleil qui défilent
    g.fillStyle = "#2a0a4a";
    const bands = 7;
    for (let i = 0; i < bands; i += 1) {
        const k = ((i + (time * 0.4) % 1) / bands);
        const y = sy + r * (k * 1.1 - 0.05);
        const thickness = 2 + k * r * 0.09;
        if (y > sy - r * 0.1) g.fillRect(sx - r, y, r * 2, thickness);
    }

    // Sol
    const floor = g.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, "#1a0530");
    floor.addColorStop(1, "#05010c");
    g.fillStyle = floor;
    g.fillRect(0, horizon, w, h - horizon);

    g.save();
    g.strokeStyle = "#ff2bd6";
    g.shadowColor = "#ff2bd6";
    g.shadowBlur = 10;
    g.lineWidth = 1.5;
    // Lignes horizontales qui défilent vers le joueur
    const rows = 14;
    for (let i = 0; i < rows; i += 1) {
        const k = (i + ((time * 0.8) % 1)) / rows;
        const y = horizon + Math.pow(k, 2.2) * (h - horizon);
        g.globalAlpha = Math.min(1, k * 2);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
    }
    // Lignes de fuite
    g.globalAlpha = 0.8;
    const cols = 22;
    for (let i = -cols; i <= cols; i += 1) {
        g.beginPath();
        g.moveTo(w / 2 + i * 12, horizon);
        g.lineTo(w / 2 + i * (w / cols) * 1.6, h);
        g.stroke();
    }
    g.restore();

    g.strokeStyle = "#2de2ff";
    g.shadowColor = "#2de2ff";
    g.shadowBlur = 14;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, horizon);
    g.lineTo(w, horizon);
    g.stroke();
    g.shadowBlur = 0;
}

// ---------------------------------------------------------------------------
// Boucle principale
// ---------------------------------------------------------------------------

function isGameplayActive() {
    return (
        state.phase === "playing" &&
        !state.paused &&
        !player.pendingClassChoice &&
        state.sectorPhase !== "cards"
    );
}

function step(delta) {
    const active = isGameplayActive();
    if (active) {
        state.time += delta;
        const fighting = state.sectorPhase === "fight" || state.sectorPhase === "boss";
        if (fighting) elapsedTime += delta;
        if (state.sectorPhase !== "exit") updatePlayer(delta);
        const arenaIntro = state.sectorPhase === "intro" && getSector().arena;
        if (fighting || (state.sectorPhase === "intro" && !arenaIntro)) shoot();
        updateProjectiles(delta);
        updateEnemyProjectiles(delta);
        if (state.sectorPhase !== "exit") updatePickups(delta);
        updateMines(delta);
        updateDrones(delta);
        updateEnemies(delta);
        updateCombo(delta);
        updateSectorFlow(delta);
    }
    if (active || state.phase === "gameover") updateEffects(delta);
}

function render() {
    ctx.save();
    if (state.shake > 0.3) {
        ctx.translate(
            (Math.random() - 0.5) * state.shake,
            (Math.random() - 0.5) * state.shake
        );
    }
    drawArena();
    drawPortal();
    drawPickups();
    drawMines();
    drawEnemies();
    drawEnemyProjectiles();
    drawProjectiles();
    drawDrones();
    drawPlayer();
    drawEffects();
    ctx.restore();

    // Aberration chromatique sur les gros chocs
    if (state.shake > 6) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.25, state.shake / 80);
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(canvas, 3, 0);
        ctx.restore();
    }

    drawOverlayTexts();
}

let titleTime = 0;

function loop(timestamp) {
    if (!loop.last) loop.last = timestamp;
    // Delta plafonné : un onglet en arrière-plan ne fait plus téléporter les ennemis.
    const delta = Math.min(0.05, (timestamp - loop.last) / 1000);
    loop.last = timestamp;

    if (isOverlayVisible(menuOverlay)) {
        titleTime += delta;
        drawTitleScreen(titleTime);
    }

    step(delta);
    render();
    updateHUD();

    requestAnimationFrame(loop);
}

// Hooks de test (Playwright / console)
window.__game = {
    state,
    player,
    enemies,
    projectiles,
    enemyProjectiles,
    pickups,
    upgrades,
    perks,
    get sector() {
        return getSector();
    },
    startNewGame,
    continueFromSave,
    returnToMenu,
    spawnEnemy,
    killEnemy,
    damageEnemy,
    gainXP,
    startBossPhase,
    startChallenge,
    beginSector,
    chooseClass,
    estimatePlayerDps,
    getShotCount,
    getFireCooldown,
    applyPerk,
    setDifficulty,
    spendUpgradePoint,
    step,
    togglePause,
    handlePlayerDeath,
};

resetPlayerModifiers();
initUpgradePanel();
updateDifficultyDisplay();
requestAnimationFrame(loop);
