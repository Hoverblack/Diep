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

const state = {
    level: 1,
    xp: 0,
    xpToNext: 100,
    upgradePoints: 0,
    difficultyIndex: 2,
    pendingClassTier: null,
    paused: false,
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
};

const keys = {
    z: false,
    q: false,
    s: false,
    d: false,
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
        spawnRate: 0.4,
        spawnAcceleration: 0.015,
        minSpawnInterval: 900,
        enemyHealthMultiplier: 0.6,
        enemyHealthGrowth: 0.01,
        enemySpeedMultiplier: 0.7,
        enemySpeedGrowth: 0.005,
        baseMaxEnemies: 5,
        maxEnemiesGrowth: 0.01,
    },
    {
        name: "Facile",
        spawnRate: 0.7,
        spawnAcceleration: 0.02,
        minSpawnInterval: 800,
        enemyHealthMultiplier: 0.8,
        enemyHealthGrowth: 0.015,
        enemySpeedMultiplier: 0.85,
        enemySpeedGrowth: 0.008,
        baseMaxEnemies: 7,
        maxEnemiesGrowth: 0.015,
    },
    {
        name: "Moyen",
        spawnRate: 1,
        spawnAcceleration: 0.025,
        minSpawnInterval: 700,
        enemyHealthMultiplier: 1,
        enemyHealthGrowth: 0.02,
        enemySpeedMultiplier: 1,
        enemySpeedGrowth: 0.01,
        baseMaxEnemies: 9,
        maxEnemiesGrowth: 0.02,
    },
    {
        name: "Difficile",
        spawnRate: 1.3,
        spawnAcceleration: 0.03,
        minSpawnInterval: 600,
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
    { key: "rareSkin", label: "Skin rare", color: "#74f0ff", duration: 45000, rare: true },
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
    10: ["sniper", "machineGun"],
    20: ["destroyer", "droneController"],
    30: ["shotgun", "octoTank"],
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
            playerModifiers.droneCount += 3;
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
        health: 600,
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
        health: 420,
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
        health: 480,
        xp: 220,
        speed: 90,
        behavior: "bossSpiral",
    },
];

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
}, 0);

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        event.preventDefault();
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
    setDifficulty(index);
    updateHUD();
});

pauseButton.addEventListener("click", () => {
    state.paused = !state.paused;
    pauseButton.textContent = state.paused ? "Reprendre" : "Pause";
});

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
    difficultyLabel.textContent = getDifficultyConfig().name;
    difficultyRange.value = state.difficultyIndex;
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
        return (playerModifiers.shotgunPellets || 5) + upgrades.multiShot.level;
    }
    return 1 + upgrades.multiShot.level + playerModifiers.extraShotCount;
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

function gainXP(amount) {
    const xpBonus = isBuffActive("tripleXP") ? 3 : 1;
    state.xp += amount * xpBonus;
    while (state.xp >= state.xpToNext) {
        state.xp -= state.xpToNext;
        state.level += 1;
        state.upgradePoints += 1;
        state.xpToNext = Math.round(state.xpToNext * 1.2 + 20);
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

function addBuff(key, duration) {
    activeBuffs[key] = performance.now() + duration;
}

function isBuffActive(key) {
    return (activeBuffs[key] || 0) > performance.now();
}

function spawnPickup() {
    const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];
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
            health: boss.health * scaling,
            currentHealth: boss.health * scaling,
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
    const type = pool[Math.floor(Math.random() * pool.length)];
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
    const homing = isBuffActive("aimbot") ? 0.08 : 0;
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

    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    player.angle = Math.atan2(dy, dx);
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
            player.health -= p.damage;
            enemyProjectiles.splice(i, 1);
            if (player.health < 0) player.health = 0;
        }
    }
}

function updateDrones(dt) {
    if (playerModifiers.droneCount <= 0) {
        drones.length = 0;
        return;
    }
    while (drones.length < playerModifiers.droneCount) {
        drones.push({
            angle: (Math.PI * 2 * drones.length) / playerModifiers.droneCount,
            cooldown: 0,
            orbit: 80,
            x: player.x,
            y: player.y,
        });
    }
    drones.length = playerModifiers.droneCount;
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
            player.health -= contactDamage * dt;
            if (player.health <= 0) {
                player.health = 0;
            }
        }

        for (let j = projectiles.length - 1; j >= 0; j -= 1) {
            const p = projectiles[j];
            const distToProjectile = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (distToProjectile < enemy.size + p.radius) {
                enemy.currentHealth -= p.damage;
                projectiles.splice(j, 1);
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
        // Simple reset
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
        for (const key of Object.keys(activeBuffs)) {
            delete activeBuffs[key];
        }
        elapsedTime = 0;
        bossTimer = 0;
        pickupTimer = 0;
        completedClassTiers.clear();
        player.selectedClasses = [];
        player.pendingClassChoice = false;
        state.pendingClassTier = null;
        hideClassOverlay();
        resetPlayerModifiers();
        refreshUpgradePanel();
        updateHUD();
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
    if (!paused) {
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
