const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let cols, rows;
const CELL_SIZE = 10;
const DROP_SPEED_MIN = 0.1;
const DROP_SPEED_MAX = 0.4;

let grid = [];
let drops = [];
let phase = 'toBlack';
let totalCells = 0;
let isPaused = false;

class ViscousDrop {
    constructor(col, colorVal, type = 'heavy') {
        this.centerCol = col;
        this.colorVal = colorVal;

        if (type === 'fast') {
            this.radius = 0;
            this.speed = (Math.random() * 2.0) + 2.0;
        } else if (type === 'small') {
            this.radius = 1;
            this.speed = (Math.random() * 0.3) + 0.4;
        } else {
            this.radius = Math.floor(Math.random() * 3) + 2;
            this.speed = (Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN) + DROP_SPEED_MIN);
            this.speed += this.radius * 0.05;
        }

        this.y = -this.radius - 1;
        this.active = true;

        this.offsets = [];
        for (let dx = -this.radius; dx <= this.radius; dx++) {
            const delta = this.radius - Math.sqrt(this.radius * this.radius - dx * dx);
            this.offsets[dx + this.radius] = delta;
        }
    }

    update() {
        if (!this.active) return;
        this.y += this.speed;
        let stillActive = false;
        for (let dx = -this.radius; dx <= this.radius; dx++) {
            const col = this.centerCol + dx;
            if (col < 0 || col >= cols) continue;
            const offset = this.offsets[dx + this.radius];
            const colY = this.y - offset;
            const oldY = Math.floor(colY - this.speed);
            const newY = Math.floor(colY);
            for (let r = oldY; r <= newY; r++) {
                if (r >= 0 && r < rows) {
                    if (grid[col][r] !== this.colorVal) {
                        grid[col][r] = this.colorVal;
                    }
                }
            }
            if (colY < rows + this.radius + 5) {
                stillActive = true;
            }
        }
        if (!stillActive) this.active = false;
    }
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(loop);
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cols = Math.ceil(width / CELL_SIZE);
    rows = Math.ceil(height / CELL_SIZE);
    resetGrid();
}

function resetGrid() {
    grid = [];
    totalCells = cols * rows;
    const startVal = phase === 'toBlack' ? 0 : 1;
    const fillVal = isPaused ? (phase === 'toBlack' ? 1 : 0) : startVal;
    for (let i = 0; i < cols; i++) {
        grid[i] = new Uint8Array(rows).fill(fillVal);
    }
    drops = [];
}

function spawnDrops() {
    if (isPaused) return;
    if (drops.length > cols) return;
    if (Math.random() > 0.4) return;
    const targetColor = phase === 'toBlack' ? 1 : 0;
    const rand = Math.random();
    let type = 'heavy';
    if (rand < 0.15) type = 'fast';
    else if (rand < 0.6) type = 'small';
    let candidates = [];
    for (let c = 0; c < cols; c++) {
        if (grid[c][0] !== targetColor) candidates.push(c);
    }
    let col = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : Math.floor(Math.random() * cols);
    drops.push(new ViscousDrop(col, targetColor, type));
}

function checkPhaseCompletion() {
    if (isPaused) return;
    let currentTargetCount = 0;
    const target = phase === 'toBlack' ? 1 : 0;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if (grid[c][r] === target) currentTargetCount++;
        }
    }
    if (currentTargetCount >= totalCells * 0.998) {
        for (let i = 0; i < cols; i++) grid[i].fill(target);
        drops = [];
        isPaused = true;
        setTimeout(() => {
            phase = phase === 'toBlack' ? 'toWhite' : 'toBlack';
            isPaused = false;
        }, 2000);
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let c = 0; c < cols; c++) {
        const colData = grid[c];
        const x = c * CELL_SIZE;
        for (let r = 0; r < rows; r++) {
            const val = colData[r];
            if (val === 1) {
                ctx.fillStyle = 'black';
                ctx.fillRect(x, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(x, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function loop() {
    spawnDrops();
    for (let i = drops.length - 1; i >= 0; i--) {
        drops[i].update();
        if (!drops[i].active) drops.splice(i, 1);
    }
    draw();
    checkPhaseCompletion();
    requestAnimationFrame(loop);
}

// MENU LOGIC
const menuContainer = document.getElementById('menu-container');
const dynamicView = document.getElementById('dynamic-view');
const dynamicList = document.getElementById('dynamic-list');
const viewTitle = document.getElementById('view-title');

let currentView = 'main';
let mainIndex = 0;
let subIndex = 0;

const mainItems = menuContainer.querySelectorAll('.menu-item');
let currentSubItems = [];

const viewData = {
    discord: {
        title: 'DISCORD // ACCESS',
        items: [
            { name: 'JOIN MAIN SERVER', url: 'https://discord.gg/Z99W3EZ37C' },
            { name: 'COMMUNITY HUB', url: 'https://discord.com/invite/Z99W3EZ37C' },
            { name: 'STATUS: ONLINE', url: null }
        ]
    },
    telegram: {
        title: 'TELEGRAM // LOGS',
        items: [
            { name: 'PRIMARY CHANNEL', url: 'https://t.me/nedoedal' },
            { name: 'FEEDBACK / DM', url: 'https://t.me/Flexiy1' },
            { name: 'LATEST UPDATES', url: 'https://t.me/nedoedal' }
        ]
    },
    reddit: {
        title: 'REDDIT // THREADS',
        items: [
            { name: 'USER PROFILE', url: 'https://www.reddit.com/user/Reasonable-Buy-2975/' },
            { name: 'RECENT POSTS', url: 'https://www.reddit.com/user/Reasonable-Buy-2975/posts/' },
            { name: 'SUBREDDIT MODS', url: null }
        ]
    },
    twitter: {
        title: 'X // BROADCAST',
        items: [
            { name: 'FLEXIY FEED', url: 'https://x.com/Flexiy396429' },
            { name: 'MEDIA LOGS', url: 'https://x.com/Flexiy396429/media' },
            { name: 'STATUS: ACTIVE', url: null }
        ]
    },
    twitch: {
        title: 'TWITCH // LIVE',
        items: [
            { name: 'STREAM CHANNEL', url: 'https://twitch.tv/nedoedal' },
            { name: 'VOD ARCHIVE', url: 'https://twitch.tv/nedoedal/videos' },
            { name: 'SCHEDULE', url: null }
        ]
    }
};

async function fetchGithubProjects() {
    dynamicList.innerHTML = '<li class="menu-item loading-text">fetching from api...</li>';
    try {
        const response = await fetch('https://api.github.com/users/FLEXIY0/repos?sort=updated&visibility=public&per_page=15');
        const data = await response.json();
        if (Array.isArray(data)) {
            const projects = data.map(repo => ({ name: repo.name, url: repo.html_url }));
            renderDynamicMenu(projects);
        }
    } catch (e) {
        dynamicList.innerHTML = '<li class="menu-item">API OFFLINE</li>';
    }
}

function renderDynamicMenu(items) {
    dynamicList.innerHTML = '';

    // Merge actual items with a BACK option
    const fullItems = [...items, { name: '.. BACK', isBack: true }];

    fullItems.forEach((item, i) => {
        const li = document.createElement('li');
        li.className = 'menu-item';
        if (item.url) li.setAttribute('data-url', item.url);
        if (item.isBack) li.setAttribute('data-back', 'true');

        li.innerHTML = `<span class="selector">></span><span class="menu-text">${item.name}</span>`;

        li.addEventListener('mouseenter', () => {
            if (currentView !== 'main') {
                subIndex = i;
                updateSelections();
            }
        });
        li.addEventListener('click', () => {
            if (currentView !== 'main') handleEnter();
        });

        dynamicList.appendChild(li);
    });
    currentSubItems = dynamicList.querySelectorAll('.menu-item');
    updateSelections();
}

function updateSelections() {
    // Update main menu
    mainItems.forEach((item, i) => {
        if (i === mainIndex) {
            item.classList.add('active');
            if (currentView === 'main') item.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        } else {
            item.classList.remove('active');
        }
    });

    // Update sub menu
    if (currentSubItems.length > 0) {
        currentSubItems.forEach((item, i) => {
            if (i === subIndex) {
                item.classList.add('active');
                if (currentView !== 'main') item.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            } else {
                item.classList.remove('active');
            }
        });
    }
}

function handleEnter() {
    if (currentView === 'main') {
        const item = mainItems[mainIndex];
        const targetView = item.getAttribute('data-target');

        if (targetView) {
            currentView = targetView;
            menuContainer.classList.remove('active');
            dynamicView.classList.add('active');
            subIndex = 0;

            if (targetView === 'github') {
                viewTitle.textContent = 'GH // REPOSITORIES';
                fetchGithubProjects();
            } else {
                const data = viewData[targetView];
                viewTitle.textContent = data.title;
                renderDynamicMenu(data.items);
            }
        }
    } else {
        const item = currentSubItems[subIndex];
        if (item) {
            if (item.getAttribute('data-back')) {
                handleBack();
            } else {
                const url = item.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            }
        }
    }
}

function handleBack() {
    if (currentView !== 'main') {
        currentView = 'main';
        dynamicView.classList.remove('active');
        menuContainer.classList.add('active');
        currentSubItems = [];
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const up = ['arrowup', 'w', 'ц'];
    const down = ['arrowdown', 's', 'ы'];
    const enter = ['enter', ' '];
    const back = ['escape', 'backspace'];

    if (up.includes(key)) {
        if (currentView === 'main') {
            mainIndex = (mainIndex - 1 + mainItems.length) % mainItems.length;
        } else if (currentSubItems.length > 0) {
            subIndex = (subIndex - 1 + currentSubItems.length) % currentSubItems.length;
        }
        updateSelections();
        e.preventDefault();
    } else if (down.includes(key)) {
        if (currentView === 'main') {
            mainIndex = (mainIndex + 1) % mainItems.length;
        } else if (currentSubItems.length > 0) {
            subIndex = (subIndex + 1) % currentSubItems.length;
        }
        updateSelections();
        e.preventDefault();
    } else if (enter.includes(key)) {
        handleEnter();
        e.preventDefault();
    } else if (back.includes(key)) {
        handleBack();
        e.preventDefault();
    }
});

// Initial mouse setup for main items
mainItems.forEach((item, i) => {
    item.addEventListener('mouseenter', () => {
        if (currentView === 'main') {
            mainIndex = i;
            updateSelections();
        }
    });
    item.addEventListener('click', () => {
        if (currentView === 'main') handleEnter();
    });
});

// CUSTOM CURSOR
const customCursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

// Cursor Hover Logic
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.menu-item') || e.target.closest('button')) {
        customCursor.classList.add('hovering');
    }
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.menu-item') || e.target.closest('button')) {
        customCursor.classList.remove('hovering');
    }
});

// Update Clock
function updateClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// GAME LOGIC: VERTICAL SHOOTER
let score = 0;
const bullets = [];
const enemies = [];
const particles = [];
const systemText = document.getElementById('system-text');
const scoreBlock = document.getElementById('score-block');
const scoreVal = document.getElementById('score-val');

// Initialize Player Ship
const playerShip = document.createElement('div');
playerShip.className = 'player-ship';
// Create shape: . X . / X X X
const shipPixels = [0, 1, 0, 1, 1, 1];
shipPixels.forEach(p => {
    const d = document.createElement('div');
    if (p) d.className = 'pixel';
    playerShip.appendChild(d);
});
document.body.appendChild(playerShip);
playerShip.style.display = 'none'; // Hidden by default

let playerX = window.innerWidth / 2;
let isGameActive = false;
let linksFalling = false;
const fallingItems = [];

const ENEMY_ARTS = [
    `[=]`, `█▄█`, `<X>`, `(O)`
];

class Bullet {
    constructor(x, y) {
        this.el = document.createElement('div');
        this.el.className = 'bullet';
        this.x = x;
        this.y = y;
        this.speed = 15;
        this.active = true;

        this.el.style.left = this.x + 'px';
        this.el.style.top = this.y + 'px';
        document.body.appendChild(this.el);
    }

    update() {
        this.y -= this.speed;
        this.el.style.top = this.y + 'px';
        if (this.y < -20) this.remove();
    }

    remove() {
        this.active = false;
        this.el.remove();
    }
}

class Enemy {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'enemy';
        // Simple square block, CSS handles the look

        this.width = 24;
        this.height = 24;
        this.x = Math.random() * (window.innerWidth - 30);
        this.y = -30;

        // Speed increases with level (score)
        const baseSpeed = 3 + (score * 0.5);
        this.speed = baseSpeed + Math.random() * 2;

        this.active = true;

        this.el.style.left = this.x + 'px';
        this.el.style.top = this.y + 'px';
        document.body.appendChild(this.el);
    }

    update() {
        this.y += this.speed;
        this.el.style.top = this.y + 'px';

        // Check if hit bottom (Miss)
        if (this.y > window.innerHeight) {
            score = 0; // Reset level
            updateLevelDisplay(true); // Show LOSE status
            this.remove();
        }
    }

    remove() {
        this.active = false;
        this.el.remove();
    }

    explode() {
        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = this.x + 12 + 'px';
            p.style.top = this.y + 12 + 'px';
            document.body.appendChild(p);
            particles.push({
                el: p,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0
            });
        }
    }
}

function updateLevelDisplay(isLoss = false) {
    systemText.style.display = 'none';
    scoreBlock.style.display = 'inline';
    scoreVal.textContent = score;

    const menuHeader = document.querySelector('.pixel-text'); // Main menu header
    if (!menuHeader) return;

    if (score >= 30) {
        menuHeader.textContent = 'YOU WIN';
        menuHeader.style.color = '#00ffcc';
        menuHeader.style.textShadow = 'none';
    } else if (isLoss) {
        menuHeader.textContent = 'YOU LOSE';
        menuHeader.style.color = '#ff0033';
        menuHeader.style.textShadow = 'none';
    } else {
        menuHeader.textContent = 'SELECT SOURCE';
        menuHeader.style.color = '';
        menuHeader.style.textShadow = '';
    }
}

// Input Handling
function handleInputMove(x, y) {
    // Custom Cursor
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        customCursor.style.left = x + 'px';
        customCursor.style.top = y + 'px';
    }
    // Player Ship Movement (Follow X, Fixed Y)
    playerX = x;
    playerShip.style.left = playerX + 'px';
}

function handleInputFire() {
    if (isGameActive) {
        bullets.push(new Bullet(playerX, window.innerHeight - 50));
    }
}

// Mouse Events
document.addEventListener('mousemove', (e) => {
    handleInputMove(e.clientX, e.clientY);
});

document.addEventListener('mousedown', (e) => {
    handleInputFire();
});

// Touch Events (Mobile)
document.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Stop scrolling
    const touch = e.touches[0];
    handleInputMove(touch.clientX, touch.clientY);
}, { passive: false });

document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInputMove(touch.clientX, touch.clientY); // Move ship to finger instantly
    handleInputFire();
}, { passive: false });

function spawnEnemies() {
    // Only spawn if active and none exist
    if (isGameActive && enemies.length === 0 && score < 30) {
        enemies.push(new Enemy());
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.03;
        if (p.life <= 0) {
            p.el.remove();
            particles.splice(i, 1);
            continue;
        }
        const x = parseFloat(p.el.style.left) + p.vx;
        const y = parseFloat(p.el.style.top) + p.vy;
        p.el.style.left = x + 'px';
        p.el.style.top = y + 'px';
        p.el.style.opacity = p.life;
    }
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const b = bullets[i];
            const e = enemies[j];
            if (!b.active || !e.active) continue;

            const dx = Math.abs(b.x - e.x);
            const dy = Math.abs(b.y - e.y);

            if (dx < 30 && dy < 30) {
                // HIT!
                score++;
                updateLevelDisplay();

                e.explode();
                e.remove();
                b.remove();
            }
        }
    }
}

// Falling Links Logic
function updateFallingLinks() {
    if (!linksFalling) return;
    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        item.vy += 0.5; // Gravity
        item.y += item.vy;
        item.x += item.vx;
        item.r += item.vr;
        item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.r}deg)`;

        if (item.y > window.innerHeight + 100) {
            item.el.style.display = 'none'; // Hide instead of remove to keep DOM clean
            fallingItems.splice(i, 1);
        }
    }
}

function dropLinks() {
    linksFalling = true;
    const items = document.querySelectorAll('.menu-item');
    items.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Set fixed position to current visual position
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = rect.width + 'px'; // Maintain width
        el.style.zIndex = '1000';

        fallingItems.push({
            el: el,
            x: rect.left,
            y: rect.top,
            vx: (Math.random() - 0.5) * 4,
            vy: -5 - Math.random() * 5, // Initial jump up
            vr: (Math.random() - 0.5) * 10,
            r: 0
        });
    });
}

function handleEnter() {
    if (currentView === 'main') {
        const item = mainItems[mainIndex];
        const targetView = item.getAttribute('data-target');

        // GAME MODE TOGGLE
        if (targetView === 'gamemode') {
            if (!isGameActive) {
                // START GAME
                isGameActive = true;
                playerShip.style.display = 'grid'; // Show ship
                score = 0;
                updateLevelDisplay();
                item.querySelector('.menu-text').textContent = "STOP GAME";
            } else {
                // SECOND CLICK: CHAOS
                dropLinks();
                document.getElementById('header-bar').style.display = 'none'; // Hide header too for full clean effect
                document.querySelector('.pixel-text').textContent = ""; // Clear title
            }
            return;
        }

        if (targetView) {
            currentView = targetView;
            menuContainer.classList.remove('active');
            dynamicView.classList.add('active');
            subIndex = 0;

            if (targetView === 'github') {
                viewTitle.textContent = 'GH // REPOSITORIES';
                fetchGithubProjects();
            } else {
                const data = viewData[targetView];
                if (data) {
                    viewTitle.textContent = data.title;
                    renderDynamicMenu(data.items);
                }
            }
        }
    } else {
        const item = currentSubItems[subIndex];
        if (item) {
            if (item.getAttribute('data-back')) {
                handleBack();
            } else {
                const url = item.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            }
        }
    }
}

function mainLoop() {
    // Update drops (background)
    spawnDrops();
    for (let i = drops.length - 1; i >= 0; i--) {
        drops[i].update();
        if (!drops[i].active) drops.splice(i, 1);
    }

    // Game Updates
    if (isGameActive) {
        spawnEnemies();

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update();
            if (!bullets[i].active) bullets.splice(i, 1);
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            if (!enemies[i].active) enemies.splice(i, 1);
        }

        updateParticles();
        checkCollisions();
    }

    if (linksFalling) {
        updateFallingLinks();
    }

    draw();
    checkPhaseCompletion();
    requestAnimationFrame(mainLoop);
}

// Override loop with mainLoop
function init() {
    resize();
    resetGrid(); // Ensure drops grid is reset
    window.addEventListener('resize', resize);
    requestAnimationFrame(mainLoop);
}

init();
