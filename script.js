const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// DOM references
const levelDisplay = document.getElementById("levelDisplay");
const hpDisplay = document.getElementById("hpDisplay");
const xpText = document.getElementById("xpText");
const xpFill = document.getElementById("xpFill");
const bossTimerText = document.getElementById("bossTimerText");
const bossFill = document.getElementById("bossFill");
const upgradePointsDisplay = document.getElementById("upgradePoints");
const upgradeList = document.getElementById("upgradeList");
const difficultyLabel = document.getElementById("difficultyLabel");
const difficultyRange = document.getElementById("difficultyRange");
const classOverlay = document.getElementById("classOverlay");
const classOptions = document.getElementById("classOptions");
const classTierLabel = document.getElementById("classTierLabel");
const pauseButton = document.getElementById("pauseButton");
const menuOverlay = document.getElementById("menuOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const controlsOverlay = document.getElementById("controlsOverlay");
const startGameButton = document.getElementById("startGameButton");
const restartButton = document.getElementById("restartButton");
const returnMenuButton = document.getElementById("returnMenuButton");
const showControlsButton = document.getElementById("showControlsButton");
const closeControlsButton = document.getElementById("closeControlsButton");
const menuDifficultyRange = document.getElementById("menuDifficultyRange");
const menuDifficultyLabel = document.getElementById("menuDifficultyLabel");
const difficultyModeToggle = document.getElementById("difficultyModeToggle");
const trackpadModeToggle = document.getElementById("trackpadModeToggle");

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
};

const upgrades = {
    fireRate: {
        label: "Cadence de tir",
        description: "Réduit le délai entre les tirs.",
        maxLevel: 8,
        level: 0,
    },
    multiShot: {
        label: "Multi-shot",
        description: "Ajoute des projectiles simultanés.",
        maxLevel: 5,
        level: 0,
    },
    xpGain: {
        label: "Maîtrise XP",
        description: "Augmente l'XP gagnée.",
        maxLevel: 5,
        level: 0,
    },
    moveSpeed: {
        label: "Vitesse",
        description: "Augmente la vitesse de déplacement.",
        maxLevel: 6,
        level: 0,
    },
    health: {
        label: "Points de vie",
        description: "Augmente la vie maximale.",
        maxLevel: 6,
        level: 0,
    },
    damage: {
        label: "Dégâts",
        description: "Augmente les dégâts des projectiles.",
        maxLevel: 6,
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
        maxLevel: 3,
        level: 0,
    },
};

const keys = {
    z: false,
    q: false,
    s: false,
    d: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
};

const mouse = {
    x: 0,
    y: 0,
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
    lastShot: 0,
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

let enemySpawnTimer = 0;
const enemySpawnInterval = 1200;
let elapsedTime = 0;
let pickupTimer = 0;
const pickupInterval = 9000;
let bossTimer = 0;
let nextBossDelay = 0;
let bossCount = 0;
const BOSS_INTERVAL_MIN = 20000;
const BOSS_INTERVAL_MAX = 40000;

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
};

const BASE_PROJECTILE_SPEED = 520;

function rollNextBossDelay() {
    const baseMin = BOSS_INTERVAL_MIN;
    const baseMax = BOSS_INTERVAL_MAX;
    const difficultyFactor = 1 - Math.min(0.5, getDifficultyConfig().spawnRate * 0.05);
    const min = baseMin * difficultyFactor;
    const max = baseMax * difficultyFactor;
    nextBossDelay = min + Math.random() * (max - min);
}

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
    { key: "speed", label: "Boost de vitesse", color: "#58ffb3", duration: 20000 },
    { key: "fireRate", label: "Cadence ++", color: "#ffc857", duration: 15000 },
    { key: "tripleXP", label: "XP x3", color: "#a483ff", duration: 10000 },
    { key: "aimbot", label: "Aim-bot", color: "#ff6ac1", duration: 12000 },
    { key: "rareSkin", label: "Skin rare c'est juste ça", color: "#74f0ff", duration: 45000, rare: true },
    { key: "heal", label: "Orbe de soin", color: "#8cf7ff", heal: 28 },
    { key: "droneAssist", label: "Escouade temporaire", color: "#ffd37a", duration: 30000 },
    { key: "upgradeOrb", label: "Orbe de maîtrise", color: "#9eff7d", minLevel: 25 },
];

const playerSkins = [
    { body: "#4bd1ff", cannon: "#1d9fff" },
    { body: "#ff6b6b", cannon: "#ff9a3c" },
    { body: "#a66bff", cannon: "#6e34ff" },
    { body: "#6bff95", cannon: "#27d787" },
    { body: "#ff9ce6", cannon: "#ff58c0" },
    { body: "#ffd66b", cannon: "#ff9b3d" },
    { body: "#7d9bff", cannon: "#4765ff" },
    { body: "#7dffcf", cannon: "#2fe6ae" },
];
let currentSkinIndex = 0;
const unlockedSkinIndexes = new Set([0]);
const completedClassTiers = new Set();

const classTiers = {
    5: ["sniper", "machineGun"],
    10: ["destroyer", "droneController"],
    15: ["shotgun", "octoTank"],
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
        description: "Cadence ++, multi-shot renforcé.",
        apply() {
            playerModifiers.fireRateMultiplier *= 0.65;
            playerModifiers.damageMultiplier *= 0.9;
            playerModifiers.extraShotCount += 2;
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
        shape: "hex",
        color: "#7dffec",
        size: 32,
        health: 110,
        xp: 78,
        speed: 82,
        behavior: "shooterDouble",
        weightByDifficulty: [0.02, 0.05, 0.08, 0.12, 0.18, 0.7, 1.1, 1.2],
    },
];

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
];

function getArchetypeWeight(type, difficultyIndex) {
    if (type.weightByDifficulty && type.weightByDifficulty.length) {
        const clampedIndex = Math.min(
            type.weightByDifficulty.length - 1,
            Math.max(0, difficultyIndex)
        );
        let weight = type.weightByDifficulty[clampedIndex] ?? 0;
        const shooterBehaviors = ["shooterSingle", "shooterDouble", "shooterSix"];
        if (shooterBehaviors.includes(type.behavior)) {
            if (difficultyIndex <= 1) {
                weight *= 0.08; // quasi nul en Jeu d'enfant / Facile
            } else if (difficultyIndex === 2) {
                weight *= 0.14; // très rare en Moyen
            } else if (difficultyIndex === 3) {
                weight *= 0.4; // réduit en Difficile
            }
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

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.parentElement.clientWidth || 800;
    const height = rect.height || 500;
    canvas.width = width;
    canvas.height = height;
}

// Ensure proper initial sizing after layout
setTimeout(() => {
    resizeCanvas();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    mouse.x = player.x;
    mouse.y = player.y;
    resetRunState();
    state.paused = true;
    trackpadModeToggle.checked = state.trackpadMode;
    refreshDifficultyModeButtons();
    updateDifficultyDisplay();
    updateHUD();
    showOverlay(menuOverlay);
}, 0);

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        event.preventDefault();
    }
    if (key === " ") {
        togglePause();
    }
});

window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
        event.preventDefault();
    }
});

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
});

difficultyRange.addEventListener("input", (event) => {
    const index = Number(event.target.value);
    if (Number.isNaN(index)) return;
    if (state.phase === "playing" && !state.allowMidgameDifficultyChange) {
        difficultyRange.value = state.difficultyIndex;
        return;
    }
    setDifficulty(index);
    updateHUD();
});

pauseButton.addEventListener("click", () => {
    togglePause();
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

startGameButton.addEventListener("click", () => {
    setDifficulty(Number(menuDifficultyRange.value));
    state.trackpadMode = trackpadModeToggle.checked;
    hideOverlay(controlsOverlay);
    startRun();
});

restartButton?.addEventListener("click", () => {
    startRun();
});

returnMenuButton?.addEventListener("click", () => {
    resetRunState();
    returnToMenu();
});

showControlsButton?.addEventListener("click", () => showOverlay(controlsOverlay));
closeControlsButton?.addEventListener("click", () => hideOverlay(controlsOverlay));

function updateHUD() {
    levelDisplay.textContent = state.level;
    hpDisplay.textContent = `${Math.round(player.health)} / ${player.maxHealth}`;
    xpText.textContent = `${Math.floor(state.xp)} / ${state.xpToNext}`;
    const ratio = Math.min(1, state.xp / state.xpToNext);
    xpFill.style.width = `${ratio * 100}%`;
    upgradePointsDisplay.textContent = state.upgradePoints;
    if (nextBossDelay > 0) {
        const remaining = Math.max(0, nextBossDelay - bossTimer);
        bossTimerText.textContent = `${(remaining / 1000).toFixed(1)} s`;
        const bossRatio = Math.min(1, bossTimer / nextBossDelay);
        bossFill.style.width = `${bossRatio * 100}%`;
    } else {
        bossTimerText.textContent = "--";
        bossFill.style.width = "0%";
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
        btn.disabled =
            upgrade.level >= upgrade.maxLevel || state.upgradePoints <= 0;
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
    const rate = diff.spawnRate * scaling;
    const interval = enemySpawnInterval / Math.max(0.1, rate);
    return Math.max(diff.minSpawnInterval, interval);
}

function getMaxEnemies() {
    const diff = getDifficultyConfig();
    const dynamic =
        diff.baseMaxEnemies + Math.floor(elapsedTime * diff.maxEnemiesGrowth);
    return Math.max(diff.baseMaxEnemies, dynamic);
}

function setDifficulty(index) {
    const clamped = Math.min(difficulties.length - 1, Math.max(0, index));
    state.difficultyIndex = clamped;
    elapsedTime = 0;
    enemySpawnTimer = 0;
    bossTimer = 0;
    pickupTimer = 0;
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    pickups.length = 0;
    updateDifficultyDisplay();
    applyDifficultyPlayerModifiers();
    rollNextBossDelay();
}

function applyDifficultyPlayerModifiers() {
    const diff = getDifficultyConfig();
    if (diff.playerHealthOverride) {
        player.maxHealth = diff.playerHealthOverride;
        player.health = diff.playerHealthOverride;
    } else {
        recalcPlayerStats({ refillHealth: true });
        player.health = Math.min(player.health, player.maxHealth);
    }
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

function showOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("visible"));
}

function hideOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("visible");
    setTimeout(() => overlay.classList.add("hidden"), 180);
}

function resetRunState() {
    state.xp = 0;
    state.level = 1;
    state.upgradePoints = 0;
    state.xpToNext = 100;
    Object.values(upgrades).forEach((u) => (u.level = 0));
    recalcPlayerStats({ refillHealth: true });
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    pickups.length = 0;
    drones.length = 0;
    waveIndex = 0;
    specialWaveType = null;
    specialWaveTimeLeft = 0;
    bossCount = 0;
    for (const key of Object.keys(activeBuffs)) {
        delete activeBuffs[key];
    }
    elapsedTime = 0;
    bossTimer = 0;
    pickupTimer = 0;
    enemySpawnTimer = 0;
    completedClassTiers.clear();
    player.selectedClasses = [];
    player.pendingClassChoice = false;
    state.pendingClassTier = null;
    hideClassOverlay();
    resetPlayerModifiers();
    refreshUpgradePanel();
    applyDifficultyPlayerModifiers();
    rollNextBossDelay();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    mouse.x = player.x;
    mouse.y = player.y;
}

function startRun() {
    state.phase = "playing";
    state.paused = false;
    pauseButton.textContent = "Pause";
    hideOverlay(menuOverlay);
    hideOverlay(gameOverOverlay);
    resetRunState();
    updateDifficultyLockState();
}

function returnToMenu() {
    state.phase = "menu";
    state.paused = true;
    syncDifficultyInputs();
    trackpadModeToggle.checked = state.trackpadMode;
    refreshDifficultyModeButtons();
    showOverlay(menuOverlay);
    hideOverlay(gameOverOverlay);
    updateDifficultyLockState();
}

function handlePlayerDeath() {
    if (state.phase === "gameover") return;
    state.phase = "gameover";
    state.paused = true;
    pauseButton.textContent = "Reprendre";
    showOverlay(gameOverOverlay);
}
function showClassOverlay(level) {
    const tierIds = classTiers[level];
    if (!tierIds) return;
    state.pendingClassTier = level;
    classOptions.innerHTML = "";
    classTierLabel.textContent = `Niveau ${level} atteint`;

    tierIds.forEach((id) => {
        const def = classDefinitions[id];
        if (!def) return;
        const card = document.createElement("div");
        card.className = "class-card";
        card.innerHTML = `
            <h4>${def.name}</h4>
            <p>${def.description}</p>
        `;
        const button = document.createElement("button");
        button.textContent = "Choisir";
        button.addEventListener("click", () => chooseClass(id, level));
        card.appendChild(button);
        classOptions.appendChild(card);
    });

    classOverlay.classList.remove("hidden");
    requestAnimationFrame(() => classOverlay.classList.add("visible"));
}

function hideClassOverlay() {
    classOverlay.classList.remove("visible");
    setTimeout(() => classOverlay.classList.add("hidden"), 200);
}

function chooseClass(id, level) {
    const def = classDefinitions[id];
    if (!def) return;
    def.apply();
    player.selectedClasses.push(id);
    updateSniperCannonProgression();
    completedClassTiers.add(level);
    state.pendingClassTier = null;
    player.pendingClassChoice = false;
    hideClassOverlay();
}

classOverlay.addEventListener("click", (event) => {
    if (event.target === classOverlay) {
        // force selection to keep progression meaningful
        return;
    }
});

function initUpgradePanel() {
    upgradeList.innerHTML = "";

    Object.entries(upgrades).forEach(([key, config]) => {
        const card = document.createElement("div");
        card.className = "upgrade-card";

        card.innerHTML = `
            <header>
                <h3>${config.label}</h3>
                <button data-upgrade="${key}">Améliorer</button>
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
        button.disabled =
            config.level >= config.maxLevel || state.upgradePoints <= 0;
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
}

function applyUpgradeEffect(key) {
    if (key === "moveSpeed" || key === "health") {
        recalcPlayerStats({ refillHealth: key === "health" });
    }
}

function recalcPlayerStats({ refillHealth = false } = {}) {
    player.maxSpeed = BASE_PLAYER_STATS.maxSpeed + upgrades.moveSpeed.level * 30;
    player.acceleration =
        BASE_PLAYER_STATS.acceleration + upgrades.moveSpeed.level * 0.8;

    const prevMaxHealth = player.maxHealth || BASE_PLAYER_STATS.maxHealth;
    const ratio = prevMaxHealth ? player.health / prevMaxHealth : 1;
    const newMaxHealth = BASE_PLAYER_STATS.maxHealth + upgrades.health.level * 20;
    player.maxHealth = newMaxHealth;
    player.health = refillHealth
        ? newMaxHealth
        : Math.min(newMaxHealth, ratio * newMaxHealth);
}

function getFireCooldown() {
    const level = upgrades.fireRate.level;
    const reduction = 0.1 * level;
    const multiplier = Math.max(0.2, 1 - reduction);
    const buffMultiplier = isBuffActive("fireRate") ? 0.5 : 1;
    return player.baseFireCooldown * multiplier * playerModifiers.fireRateMultiplier * buffMultiplier;
}

function getShotCount() {
    if (playerModifiers.shotgun) {
        return (playerModifiers.shotgunPellets || 5) + upgrades.multiShot.level + playerModifiers.cannonBonusShots;
    }
    return (
        1 +
        upgrades.multiShot.level +
        playerModifiers.extraShotCount +
        playerModifiers.cannonBonusShots
    );
}

function getDamage() {
    return (
        player.baseDamage *
        (1 + upgrades.damage.level * 0.25) *
        playerModifiers.damageMultiplier
    );
}

function getProjectileSpeed() {
    return BASE_PROJECTILE_SPEED * playerModifiers.projectileSpeedMultiplier;
}

function getSpeedMultiplier() {
    let mult = 1;
    if (isBuffActive("speed")) mult *= 1.3;
    return mult;
}

function getDamageTakenMultiplier() {
    const level = upgrades.resistance.level || 0;
    const mitigation = Math.min(0.6, level * 0.1);
    return Math.max(0.3, 1 - mitigation);
}

function applyPlayerDamage(amount) {
    const finalDamage = amount * getDamageTakenMultiplier();
    player.health -= finalDamage;
    if (player.health < 0) player.health = 0;
}

function gainXP(amount) {
    const xpBonus = isBuffActive("tripleXP") ? 3 : 1;
    const xpUpgrade = 1 + upgrades.xpGain.level * 0.2;
    state.xp += amount * xpBonus * xpUpgrade;
    while (state.xp >= state.xpToNext) {
        state.xp -= state.xpToNext;
        state.level += 1;
        state.upgradePoints += 1;
        state.xpToNext = Math.round(state.xpToNext * 1.2 + 20);
        onLevelGained();
        checkClassMilestones();
    }
    updateHUD();
}

function checkClassMilestones() {
    if (player.pendingClassChoice) return;
    Object.keys(classTiers).forEach((tierLevel) => {
        const level = Number(tierLevel);
        if (state.level >= level && !completedClassTiers.has(level)) {
            player.pendingClassChoice = true;
            showClassOverlay(level);
        }
    });
}

function onLevelGained() {
    if (playerModifiers.droneCount < 4) {
        playerModifiers.droneCount += 1;
    }
    updateSniperCannonProgression();
}

function updateSniperCannonProgression() {
    if (!player.selectedClasses.includes("sniper")) {
        playerModifiers.cannonBonusShots = 0;
        return;
    }
    const targetTier = Math.min(8, 2 + Math.floor(Math.max(0, state.level - 10) / 5));
    playerModifiers.cannonBonusShots = Math.max(0, targetTier - 1);
}

function addBuff(key, duration) {
    activeBuffs[key] = performance.now() + duration;
}

function isBuffActive(key) {
    return (activeBuffs[key] || 0) > performance.now();
}

function spawnPickup() {
    const available = lootTypes.filter(
        (t) => !t.minLevel || state.level >= t.minLevel
    );
    const type = available[Math.floor(Math.random() * available.length)];
    const margin = 80;
    pickups.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        type,
        pulse: Math.random() * Math.PI * 2,
    });
}

function updatePickups(dt) {
    pickupTimer += dt * 1000;
    if (pickupTimer >= pickupInterval && pickups.length < 4) {
        pickupTimer = 0;
        spawnPickup();
    }

    pickups.forEach((pickup) => {
        pickup.pulse += dt * 2;
    });

    for (let i = pickups.length - 1; i >= 0; i -= 1) {
        const pickup = pickups[i];
        const dist = Math.hypot(player.x - pickup.x, player.y - pickup.y);
        if (dist < player.radius + 14) {
            applyPickupEffect(pickup.type);
            pickups.splice(i, 1);
        }
    }
}

function applyPickupEffect(type) {
    if (type.key === "rareSkin") {
        unlockRandomSkin();
        return;
    }

    if (type.key === "heal") {
        const healAmount = type.heal || 20;
        player.health = Math.min(player.maxHealth, player.health + healAmount);
        updateHUD();
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
            if (chosen === upgrades.damage || chosen === upgrades.resistance || chosen === upgrades.pierce) {
                // nothing extra needed, passive effects handled elsewhere
            }
            refreshUpgradePanel();
            updateHUD();
        }
        return;
    }

    // Buffs temporaires existants
    addBuff(type.key, type.duration);

    // Améliorations gratuites des compétences associées
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
    } else if (type.key === "tripleXP") {
        // Bonus léger sur les dégâts pendant la durée
        playerModifiers.damageMultiplier *= 1.05;
    } else if (type.key === "aimbot") {
        const up = upgrades.multiShot;
        if (up.level < up.maxLevel) {
            up.level += 1;
        }
    } else if (type.key === "droneAssist") {
        // rien à faire ici, le buff ajoute des drones temporaires
    }
    refreshUpgradePanel();
    updateHUD();
}

function drawPickups() {
    pickups.forEach((pickup) => {
        const glow = 6 + Math.sin(pickup.pulse) * 2;
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
        ctx.fillStyle = pickup.type.color;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 20 + glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "12px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 3;
        ctx.strokeText(pickup.type.label, 0, -24);
        ctx.fillText(pickup.type.label, 0, -24);
        ctx.restore();
    });
}

function spawnEnemy(isBoss = false) {
    if (isBoss) {
        const boss = bossConfigs[Math.floor(Math.random() * bossConfigs.length)];
        const diff = getDifficultyConfig();
        const levelFactor = 1 + state.level * 0.05;
        const scaling =
            levelFactor +
            bossCount * 0.25 +
            elapsedTime * diff.enemyHealthGrowth * 1.2;
        const bossHealthBoost = 1.35;
        const spawnX = Math.max(
            boss.size,
            Math.min(
                canvas.width - boss.size,
                canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6
            )
        );
        const spawnY = Math.max(
            boss.size,
            Math.min(
                canvas.height - boss.size,
                canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.6
            )
        );
        enemies.push({
            ...boss,
            x: spawnX,
            y: spawnY,
            health: boss.health * scaling * bossHealthBoost,
            currentHealth: boss.health * scaling * bossHealthBoost,
            xp: boss.xp * diff.enemyHealthMultiplier,
            isBoss: true,
            spin: 0,
            droneSwarm: [],
            shootTimer: 0,
            visualAngle: 0,
        });
        bossCount += 1;
        return;
    }

    let pool = enemyArchetypes;
    if (specialWaveType === "hexOnly") {
        pool = enemyArchetypes.filter((e) => e.shape === "hex");
        if (pool.length === 0) pool = enemyArchetypes;
    }
    const type = pickWeightedEnemyType(pool, state.difficultyIndex);
    const margin = 60;
    const diff = getDifficultyConfig();
    const levelFactor = 1 + state.level * 0.03;
    const healthScaling = levelFactor * (1 + elapsedTime * diff.enemyHealthGrowth);
    const speedScaling = 1 + elapsedTime * diff.enemySpeedGrowth;
    const maxHealth = Math.round(
        type.health * diff.enemyHealthMultiplier * healthScaling
    );
    const speed = type.speed * diff.enemySpeedMultiplier * speedScaling;
    const xpReward = Math.round(type.xp * (0.8 + diff.enemyHealthMultiplier * 0.2));

    enemies.push({
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: margin + Math.random() * (canvas.height - margin * 2),
        ...type,
        health: maxHealth,
        currentHealth: maxHealth,
        speed,
        xp: xpReward,
        shootTimer: 0,
        visualAngle: 0,
    });
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
}) {
    projectiles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        radius,
        life: 0,
        maxLife: life,
        damage,
        homingStrength,
        pierce,
    });
}

function spawnEnemyProjectile(enemy, angle, options = {}) {
    const speed = options.speed || 210;
    const damage = options.damage || 15;
    const radius = options.radius || 6;
    enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        damage,
        life: 0,
        maxLife: 2.5,
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
    const now = performance.now();
    if (now - player.lastShot < getFireCooldown()) return;
    player.lastShot = now;

    const count = getShotCount();
    const sniperHoming = player.selectedClasses.includes("sniper") ? 0.06 : 0;
    const homing = (isBuffActive("aimbot") ? 0.08 : 0) + sniperHoming;
    const projectileSpeed = getProjectileSpeed();

    if (playerModifiers.octoRadial) {
        const rays = 8;
        const base = performance.now() * 0.001;
        for (let i = 0; i < rays; i += 1) {
            const angle = (Math.PI * 2 * i) / rays + base * 0.4;
            createProjectile({
                x: player.x,
                y: player.y,
                angle,
                speed: projectileSpeed * 0.85,
                damage: getDamage() * 0.8,
                life: 1.2 + playerModifiers.projectileLifeBonus,
                radius: 6,
                homingStrength: homing * 0.5,
                pierce: upgrades.pierce.level,
            });
        }
        return;
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
                pierce: upgrades.pierce.level,
            });
        }
        if (playerModifiers.shotgunRecoil) {
            player.vx -= Math.cos(player.angle) * playerModifiers.shotgunRecoil;
            player.vy -= Math.sin(player.angle) * playerModifiers.shotgunRecoil;
        }
        return;
    }

    const spread = Math.min(0.5, 0.12 * (count - 1));
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
            pierce: upgrades.pierce.level,
        });
    }
}

function updatePlayer(dt) {
    let inputX = 0;
    let inputY = 0;

    if (keys.z) inputY -= 1;
    if (keys.s) inputY += 1;
    if (keys.q) inputX -= 1;
    if (keys.d) inputX += 1;

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

    let aimDX = mouse.x - player.x;
    let aimDY = mouse.y - player.y;
    if (state.trackpadMode) {
        const aimX = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0);
        const aimY = (keys.arrowdown ? 1 : 0) - (keys.arrowup ? 1 : 0);
        if (aimX !== 0 || aimY !== 0) {
            const len = Math.hypot(aimX, aimY) || 1;
            aimDX = aimX / len;
            aimDY = aimY / len;
        }
    }
    player.angle = Math.atan2(aimDY, aimDX);
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
        if (dist < player.radius + p.radius) {
            applyPlayerDamage(p.damage);
            enemyProjectiles.splice(i, 1);
        }
    }
}

function updateDrones(dt) {
    const bonusDrones = isBuffActive("droneAssist") ? 2 : 0;
    const desiredCount = Math.min(6, playerModifiers.droneCount + bonusDrones);

    if (desiredCount <= 0) {
        drones.length = 0;
        return;
    }
    while (drones.length < desiredCount) {
        drones.push({
            angle: (Math.PI * 2 * drones.length) / desiredCount,
            cooldown: 0,
            orbit: 80,
            x: player.x,
            y: player.y,
        });
    }
    drones.length = desiredCount;
    drones.forEach((drone, index) => {
        drone.angle += dt * (0.8 + index * 0.05);
        drone.x = player.x + Math.cos(drone.angle) * drone.orbit;
        drone.y = player.y + Math.sin(drone.angle) * drone.orbit;
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
                    damage: playerModifiers.droneDamage,
                    radius: 5,
                    life: 1.2,
                    homingStrength: 0.05,
                });
                drone.cooldown = playerModifiers.droneFireCooldown;
            }
        }
    });
}

function updateEnemies(dt) {
    enemySpawnTimer += dt * 1000;
    let guard = 0;
    while (enemySpawnTimer >= getSpawnInterval() && guard < 10) {
        const interval = getSpawnInterval();
        if (interval <= 0) break;
        enemySpawnTimer -= interval;
        if (enemies.length < getMaxEnemies()) {
            spawnEnemy();
        } else {
            enemySpawnTimer = 0;
            break;
        }
        guard += 1;
    }

    bossTimer += dt * 1000;
    if (nextBossDelay === 0) {
        rollNextBossDelay();
        bossTimer = 0;
    } else if (bossTimer >= nextBossDelay) {
        bossTimer = 0;
        const hasBoss = enemies.some((enemy) => enemy.isBoss);
        if (!hasBoss) {
            spawnEnemy(true);
            rollNextBossDelay();
        }
    }

    if (specialWaveTimeLeft > 0) {
        specialWaveTimeLeft -= dt;
        if (specialWaveTimeLeft <= 0) {
            specialWaveType = null;
        }
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const enemy = enemies[i];

        enemy.shootTimer = (enemy.shootTimer || 0) - dt * 1000;
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.hypot(dx, dy) || 0.0001;
        const behavior = enemy.behavior || "default";

        if (behavior === "dodger") {
            const threat = projectiles.find((p) => {
                const distToProj = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (distToProj > 180) return false;
                const projDir = Math.atan2(p.vy, p.vx);
                const diff =
                    Math.abs(
                        Math.atan2(Math.sin(projDir - enemy.visualAngle), Math.cos(projDir - enemy.visualAngle))
                    ) || 0;
                return distToProj < 180 && diff < Math.PI / 1.5;
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
            const burst = dist > 200 ? 1.6 : 1;
            enemy.x += (dx / dist) * enemy.speed * burst * dt;
            enemy.y += (dy / dist) * enemy.speed * burst * dt;
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
        } else if (behavior === "bossTank") {
            enemy.x += (dx / dist) * enemy.speed * 0.7 * dt;
            enemy.y += (dy / dist) * enemy.speed * 0.7 * dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 2600;
                for (let k = 0; k < 8; k += 1) {
                    spawnEnemyProjectile(enemy, (Math.PI / 4) * k, {
                        speed: 180,
                        damage: 12,
                        radius: 8,
                    });
                }
            }
        } else if (behavior === "bossDrone") {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
            if (!enemy.droneSwarm) enemy.droneSwarm = [];
            while (enemy.droneSwarm.length < 3) {
                enemy.droneSwarm.push({ angle: (Math.PI * 2 * enemy.droneSwarm.length) / 3 });
            }
            enemy.droneSwarm.forEach((drone) => {
                drone.angle += dt * 1.5;
                const px = enemy.x + Math.cos(drone.angle) * 70;
                const py = enemy.y + Math.sin(drone.angle) * 70;
                if (enemy.shootTimer <= 0) {
                    const angle = Math.atan2(player.y - py, player.x - px);
                    spawnEnemyProjectile(
                        { x: px, y: py },
                        angle,
                        { speed: 280, damage: 10 }
                    );
                }
            });
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 700;
            }
        } else if (behavior === "bossSpiral") {
            enemy.spin = (enemy.spin || 0) + dt * 2.5;
            enemy.x += Math.cos(enemy.spin) * enemy.speed * 0.4 * dt;
            enemy.y += Math.sin(enemy.spin) * enemy.speed * 0.4 * dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = 600;
                for (let k = 0; k < 6; k += 1) {
                    spawnEnemyProjectile(enemy, enemy.spin + (Math.PI / 3) * k, {
                        speed: 260,
                        damage: 9,
                    });
                }
            }
        } else {
            const chaseStep = Math.min(dist, (enemy.speed || 60) * dt);
            enemy.x += (dx / dist) * chaseStep;
            enemy.y += (dy / dist) * chaseStep;
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
            const contactDamage = enemy.isBoss ? 25 : behavior === "rusher" ? 14 : 8;
            applyPlayerDamage(contactDamage * dt);
        }

        for (let j = projectiles.length - 1; j >= 0; j -= 1) {
            const p = projectiles[j];
            const distToProjectile = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (distToProjectile < enemy.size + p.radius) {
                enemy.currentHealth -= p.damage;
                if (p.pierce && p.pierce > 0) {
                    p.pierce -= 1;
                } else {
                    projectiles.splice(j, 1);
                }
                if (enemy.currentHealth <= 0) {
                    if (enemy.isBoss) {
                        addBuff("tripleXP", 8000);
                        waveIndex += 1;
                        if (waveIndex % 3 === 0) {
                            specialWaveType = "hexOnly";
                            specialWaveTimeLeft = 18;
                        }
                    }
                    gainXP(enemy.xp);
                    enemies.splice(i, 1);
                }
                break;
            }
        }
    }

    if (player.health <= 0) {
        handlePlayerDeath();
    }
}

function drawGrid() {
    const spacing = 40;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPlayer() {
    const skin = playerSkins[currentSkinIndex];
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Body
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cannon
    ctx.fillStyle = skin.cannon;
    ctx.fillRect(0, -8, player.radius + 20, 16);

    ctx.restore();
}

function drawDrones() {
    if (drones.length === 0) return;
    ctx.save();
    ctx.fillStyle = "#f9ff8b";
    drones.forEach((drone) => {
        ctx.beginPath();
        ctx.arc(drone.x, drone.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawProjectiles() {
    ctx.save();
    ctx.fillStyle = "#fff";
    projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawEnemyProjectiles() {
    ctx.save();
    ctx.fillStyle = "#ff7b7b";
    enemyProjectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        const facing = (enemy.visualAngle || 0) + Math.PI / 2;
        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = enemy.isBoss ? 4 : 2;

        switch (enemy.shape) {
            case "square":
                ctx.beginPath();
                ctx.rect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case "triangle":
                ctx.save();
                ctx.rotate(facing);
                ctx.beginPath();
                ctx.moveTo(0, -enemy.size);
                ctx.lineTo(enemy.size, enemy.size);
                ctx.lineTo(-enemy.size, enemy.size);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;
            case "pentagon":
                ctx.beginPath();
                for (let i = 0; i < 5; i += 1) {
                    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
                    const px = Math.cos(angle) * enemy.size;
                    const py = Math.sin(angle) * enemy.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case "diamond":
                ctx.save();
                ctx.rotate(facing / 2);
                ctx.beginPath();
                ctx.moveTo(0, -enemy.size);
                ctx.lineTo(enemy.size, 0);
                ctx.lineTo(0, enemy.size);
                ctx.lineTo(-enemy.size, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;
            case "hex":
                ctx.beginPath();
                for (let i = 0; i < 6; i += 1) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.cos(angle) * enemy.size;
                    const py = Math.sin(angle) * enemy.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case "circle":
                ctx.beginPath();
                ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case "octagon":
                ctx.save();
                ctx.rotate(facing / 2);
                ctx.beginPath();
                for (let i = 0; i < 8; i += 1) {
                    const angle = (Math.PI / 4) * i;
                    const px = Math.cos(angle) * enemy.size;
                    const py = Math.sin(angle) * enemy.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;
        }
        ctx.restore();
    });
}

function loop(timestamp) {
    if (!loop.last) loop.last = timestamp;
    const delta = (timestamp - loop.last) / 1000;
    loop.last = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPickups();

    const paused = player.pendingClassChoice || state.paused;
    const active = state.phase === "playing" && !paused;
    if (active) {
        elapsedTime += delta;
        updatePlayer(delta);
        shoot();
        updateProjectiles(delta);
        updateEnemyProjectiles(delta);
        updatePickups(delta);
        updateDrones(delta);
        updateEnemies(delta);
        const diff = getDifficultyConfig();
        if (diff.playerHealthOverride) {
            player.health = Math.min(player.health, diff.playerHealthOverride);
        }
    }

    drawEnemies();
    drawEnemyProjectiles();
    drawProjectiles();
    drawDrones();
    drawPlayer();

    updateHUD();

    requestAnimationFrame(loop);
}

resetPlayerModifiers();
initUpgradePanel();
updateDifficultyDisplay();
updateHUD();
requestAnimationFrame(loop);
