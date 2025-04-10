// 游戏配置
const config = {
    canvasWidth: 800,
    canvasHeight: 600,
    lineY: 550, // 红线位置
    initialSpeed: 2, // 初始下落速度
    speedIncrease: 0.1, // 每500分速度增加10%
    scorePerLetter: 10, // 每个字母得分
    letterSize: 30, // 字母大小
    spawnInterval: 1000, // 字母生成间隔(毫秒)
    gameOver: false // 游戏结束状态
};

// 游戏状态
let score = 0;
let speed = config.initialSpeed;
let letters = [];
let lastSpawnTime = 0;

// 初始化游戏
function startGame() {
    // 移除所有START GAME按钮
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if(button.textContent === 'START GAME') {
            document.body.removeChild(button);
        }
    });
    
    document.addEventListener('keydown', handleKeyPress);
    requestAnimationFrame(gameLoop);
}

function init() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // 添加START GAME按钮
    const button = document.createElement('button');
    button.textContent = 'START GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.padding = '10px 20px';
    button.style.fontSize = '20px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);
    
    button.addEventListener('click', () => {
        document.body.removeChild(button);
        startGame();
    });
}

// 重置游戏状态
function resetGame() {
    score = 0;
    speed = config.initialSpeed;
    letters = [];
    lastSpawnTime = 0;
    config.gameOver = false;
    document.getElementById('score').textContent = `Score: ${score}`;
}

function endGame(ctx, canvas) {
    config.gameOver = true;
    ctx.font = '60px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    
    // 添加NEW GAME按钮
    const button = document.createElement('button');
    button.textContent = 'NEW GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '60%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.padding = '10px 20px';
    button.style.fontSize = '20px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);
    
    button.addEventListener('click', () => {
        document.body.removeChild(button);
        resetGame();
        requestAnimationFrame(gameLoop);
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            document.body.removeChild(button);
            resetGame();
            requestAnimationFrame(gameLoop);
        }
    });
}

// 游戏主循环
function gameLoop(timestamp) {
    if (config.gameOver) return;
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制红线
    ctx.beginPath();
    ctx.moveTo(0, config.lineY);
    ctx.lineTo(canvas.width, config.lineY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 生成新字母
    if (timestamp - lastSpawnTime > config.spawnInterval) {
        spawnLetter();
        lastSpawnTime = timestamp;
    }
    
    // 更新和绘制字母
    updateLetters(timestamp);
    drawLetters(ctx);
    
    // 更新分数显示
    document.getElementById('score').textContent = `Score: ${score}`;
    
    // 检查游戏结束
    if (score < 0) {
        endGame(ctx, canvas);
        config.gameOver = true;
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

// 生成随机字母
function spawnLetter() {
    const N = Math.floor(score / 200);
    let n = 1;
    
    // 当分数达到200的N倍时，60%概率生成单个字母，40%概率生成1到N个字母
    if (N > 0) {
        if (Math.random() > 0.4) {
            n = 1;
        } else {
            n = Math.floor(Math.random() * N) + 1;
        }
    }
    
    let word = '';
    
    // 生成n个随机字母
    for (let i = 0; i < n; i++) {
        word += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    }
    
    // 计算字母组合的总宽度
    const wordWidth = word.length * config.letterSize;
    
    // 确保字母组合不会超出画布边界
    const maxX = config.canvasWidth - wordWidth;
    const x = Math.random() * Math.max(0, maxX);
    
    letters.push({
        char: word,
        x: x,
        y: 0,
        size: config.letterSize,
        color: 'black',
        hit: false,
        miss: false,
        timestamp: 0
    });
}

// 更新字母位置
function updateLetters(timestamp) {
    letters = letters.filter(letter => {
        // 字母未到达红线且未被击中
        if (letter.y < config.lineY && !letter.hit) {
            letter.y += speed;
            return true;
        }
        
        // 字母被击中
        if (letter.hit) {
            if (timestamp - letter.timestamp < 200) { // 显示效果200毫秒
                letter.size += 2;
                return true;
            }
            return false;
        }
        
        // 字母未被击中且到达红线
        if (!letter.miss) {
            letter.miss = true;
            letter.color = 'red';
            letter.timestamp = timestamp;
            score -= config.scorePerLetter;
        }
        
        if (timestamp - letter.timestamp < 200) { // 显示效果200毫秒
            letter.size += 2;
            return true;
        }
        
        return false;
    });
    
    // 根据分数调整难度
    if (score > 0 && score % 100 === 0) {
        if (score < 1000) {
            // 分数小于1000时只增加字母组合数量
            config.spawnInterval = Math.max(500, 1000 - Math.floor(score / 100) * 100);
        } else {
            // 分数超过1000后每100分增加5%速度
            const n = Math.floor((score - 1000) / 100);
            speed = config.initialSpeed * (1 + n * 0.05);
        }
    }
}

// 绘制字母
function drawLetters(ctx) {
    ctx.font = `${config.letterSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    letters.forEach(letter => {
        ctx.fillStyle = letter.color;
        ctx.font = `${letter.size}px Arial`;
        ctx.fillText(letter.char, letter.x + letter.size/2, letter.y + letter.size/2);
    });
}

// 键盘输入处理
let inputBuffer = '';
let bufferTimeout = null;

function handleKeyPress(e) {
    const key = e.key.toUpperCase();
    
    // 添加到输入缓冲区
    inputBuffer += key;
    
    // 清除之前的超时
    if (bufferTimeout) {
        clearTimeout(bufferTimeout);
    }
    
    // 设置新的超时（500毫秒后清空缓冲区）
    bufferTimeout = setTimeout(() => {
        inputBuffer = '';
    }, 500);
    
    // 检查是否有匹配的字母组合
    for (let i = 0; i < letters.length; i++) {
        if (!letters[i].hit && !letters[i].miss) {
            // 检查输入缓冲区是否匹配字母组合的开头
            if (letters[i].char.startsWith(inputBuffer)) {
                // 如果完全匹配
                if (letters[i].char === inputBuffer) {
                    letters[i].hit = true;
                    letters[i].color = 'green';
                    letters[i].timestamp = performance.now();
                    score += config.scorePerLetter * letters[i].char.length;
                    inputBuffer = '';
                    break;
                }
            }
        }
    }
}

// 启动游戏
window.onload = function() {
    // 初始化游戏但不立即开始
    const canvas = document.getElementById('gameCanvas');
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // 显示START GAME按钮
    const button = document.createElement('button');
    button.textContent = 'START GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.padding = '10px 20px';
    button.style.fontSize = '20px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);
    
    button.addEventListener('click', startGame);
        
        // 添加空格键监听
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                document.body.removeChild(button);
                startGame();
            }
        });
};