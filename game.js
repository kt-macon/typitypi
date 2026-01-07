// 游戏配置（DOS风格）
const config = {
    canvasWidth: 800,
    canvasHeight: 600,
    lineY: 550, // 红线位置（DOS风格）
    initialSpeed: 0.1, // 初始下落速度
    speedIncrease: 0.005, // 每500分速度增加10%
    scorePerLetter: 10, // 每个字母得分
    letterSize: 30, // 字母大小
    spawnInterval: 1000, // 字母生成间隔(毫秒)
    gameOver: false, // 游戏结束状态
    dosColors: {
        bg: '#000000',
        text: '#00ff00',
        border: '#00ff00',
        hit: '#00ff00',
        miss: '#ff0000',
        line: '#ff0000'
    }
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
    
    // 绘制初始DOS风格界面
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = config.dosColors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '40px "Courier Prime", monospace, Fixedsys';
    ctx.fillStyle = config.dosColors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = config.dosColors.text;
    ctx.shadowBlur = 5;
    ctx.fillText('TYPING GAME', canvas.width/2, canvas.height/2 - 50);
    ctx.shadowBlur = 0;
    
    // 添加START GAME按钮（DOS风格）
    const button = document.createElement('button');
    button.textContent = 'START GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '50%';
    button.style.transform = 'translate(-50%, -50%)';
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
    document.getElementById('score').textContent = `SCORE: ${score}`;
    
    // 重置字母生成相关变量
    currentLetterIndex = 0;
    lettersSpawned = 0;
    spawnPhase = 1;
}

function endGame(ctx, canvas) {
    config.gameOver = true;
    
    // DOS风格游戏结束界面
    ctx.fillStyle = config.dosColors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '60px "Courier Prime", monospace, Fixedsys';
    ctx.fillStyle = config.dosColors.miss;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加文字阴影效果
    ctx.shadowColor = config.dosColors.miss;
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    ctx.shadowBlur = 0;
    
    // 显示最终分数
    ctx.font = '30px "Courier Prime", monospace, Fixedsys';
    ctx.fillStyle = config.dosColors.text;
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width/2, canvas.height/2 + 60);
    
    // 添加NEW GAME按钮（DOS风格，上调位置避免重叠）
    const button = document.createElement('button');
    button.textContent = 'NEW GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '55%';
    button.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(button);
    
    button.addEventListener('click', () => {
        document.body.removeChild(button);
        resetGame();
        requestAnimationFrame(gameLoop);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (document.body.contains(button)) {
                document.body.removeChild(button);
            }
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
    
    // 清空画布（DOS风格黑色背景）
    ctx.fillStyle = config.dosColors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制红线（DOS风格）
    ctx.beginPath();
    ctx.moveTo(0, config.lineY);
    ctx.lineTo(canvas.width, config.lineY);
    ctx.strokeStyle = config.dosColors.line;
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
    
    // 更新分数显示（DOS风格）
    document.getElementById('score').textContent = `SCORE: ${score}`;
    
    // 检查游戏结束
    if (score < 0) {
        endGame(ctx, canvas);
        config.gameOver = true;
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

// 字母生成逻辑相关变量
let currentLetterIndex = 0;
let spawnPhase = 1; // 1: 第一轮按顺序, 2: 第二轮单个随机, 3: 后续随机
let lettersSpawned = 0;
const PHASE1_LIMIT = 26; // 第一轮生成26个字母（A-Z）
const PHASE2_LIMIT = PHASE1_LIMIT + 26; // 第二轮再生成26个单个随机字母

// 检查新字母位置是否与现有字母重叠
function checkLetterOverlap(newX, newY, newSize, newChar) {
    const newWidth = newChar.length * newSize;
    
    for (let i = 0; i < letters.length; i++) {
        const existing = letters[i];
        const existingWidth = existing.char.length * existing.size;
        const existingHeight = existing.size;
        
        // 计算边界
        const newLeft = newX;
        const newRight = newX + newWidth;
        const newTop = newY;
        const newBottom = newY + newSize;
        
        const existingLeft = existing.x;
        const existingRight = existing.x + existingWidth;
        const existingTop = existing.y;
        const existingBottom = existing.y + existingHeight;
        
        // 检查水平和垂直重叠
        if (!(newRight < existingLeft || newLeft > existingRight || 
              newBottom < existingTop || newTop > existingBottom)) {
            return true; // 重叠
        }
    }
    
    return false; // 不重叠
}

function spawnLetter() {
    let word = '';
    let n = 1;
    
    // 根据阶段确定生成逻辑
    if (lettersSpawned < PHASE1_LIMIT) {
        // 第一轮：按顺序生成单个字母
        word = String.fromCharCode(65 + currentLetterIndex % 26);
        currentLetterIndex++;
        spawnPhase = 1;
    } else if (lettersSpawned < PHASE2_LIMIT) {
        // 第二轮：单个字母随机生成
        word = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        spawnPhase = 2;
    } else {
        // 后续轮：随机生成1-3个字母组合
        spawnPhase = 3;
        const N = Math.min(3, Math.floor(score / 200) + 1);
        n = Math.floor(Math.random() * N) + 1;
        
        for (let i = 0; i < n; i++) {
            word += String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
    }
    
    // 计算字母组合的总宽度
    const wordWidth = word.length * config.letterSize;
    
    // 确保字母组合不会超出画布边界
    const maxX = config.canvasWidth - wordWidth;
    
    // 尝试生成不重叠的位置，最多尝试10次
    let attempts = 0;
    let x, y;
    let overlap = true;
    
    while (overlap && attempts < 10) {
        x = Math.random() * Math.max(0, maxX);
        y = -config.letterSize; // 从画布上方生成
        overlap = checkLetterOverlap(x, y, config.letterSize, word);
        attempts++;
    }
    
    // 如果尝试10次都重叠，仍然生成（避免无限循环）
    if (overlap) {
        x = Math.random() * Math.max(0, maxX);
        y = -config.letterSize;
    }
    
    letters.push({
        char: word,
        x: x,
        y: y,
        size: config.letterSize,
        color: config.dosColors.text,
        hit: false,
        miss: false,
        timestamp: 0
    });
    
    lettersSpawned++;
}

// 更新字母位置（DOS风格动画）
function updateLetters(timestamp) {
    letters = letters.filter(letter => {
        // 字母被击中（DOS风格爆炸效果）
        if (letter.hit) {
            if (timestamp - letter.timestamp < 300) { // 显示效果300毫秒
                letter.size += 3;
                // DOS风格的闪烁效果
                letter.blink = (letter.blink || 0) + 0.2;
                return true;
            }
            return false;
        }
        
        // 字母未被击中且到达红线（下沿碰到红线立即触发）
        if (!letter.miss && (letter.y + letter.size/2) >= config.lineY) {
            letter.miss = true;
            letter.color = config.dosColors.miss;
            letter.timestamp = timestamp;
            score -= config.scorePerLetter;
        }
        
        // 字母未到达红线且未被击中，继续下落
        if (!letter.miss) {
            letter.y += speed;
            // 添加DOS风格的闪烁效果
            if (!letter.blink) letter.blink = 0;
            letter.blink = (letter.blink + 0.1) % (Math.PI * 2);
            return true;
        }
        
        // 处理miss后的动画效果
        if (timestamp - letter.timestamp < 300) { // 显示效果300毫秒
            letter.size += 3;
            // DOS风格的闪烁效果
            letter.blink = (letter.blink || 0) + 0.2;
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

// 绘制字母（DOS风格带闪烁效果）
function drawLetters(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    letters.forEach(letter => {
        ctx.font = `${letter.size}px 'Courier Prime', monospace, 'Fixedsys'`;
        
        // DOS风格闪烁效果
        if (letter.blink) {
            // 基于正弦函数创建闪烁效果
            const opacity = 0.5 + 0.5 * Math.abs(Math.sin(letter.blink));
            ctx.fillStyle = letter.color;
            
            // 绘制多层文字以增强DOS风格的像素化效果
            ctx.fillText(letter.char, letter.x + letter.size/2, letter.y + letter.size/2);
            
            // 添加文字阴影增强DOS效果
            if (letter.color === config.dosColors.text || letter.color === config.dosColors.hit) {
                ctx.shadowColor = letter.color;
                ctx.shadowBlur = 3;
                ctx.fillText(letter.char, letter.x + letter.size/2, letter.y + letter.size/2);
                ctx.shadowBlur = 0;
            }
        } else {
            // 正常绘制
            ctx.fillStyle = letter.color;
            ctx.fillText(letter.char, letter.x + letter.size/2, letter.y + letter.size/2);
            
            // 添加文字阴影
            if (letter.color === config.dosColors.text) {
                ctx.shadowColor = config.dosColors.text;
                ctx.shadowBlur = 5;
                ctx.fillText(letter.char, letter.x + letter.size/2, letter.y + letter.size/2);
                ctx.shadowBlur = 0;
            }
        }
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
    
    // 绘制DOS风格初始界面
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = config.dosColors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 显示游戏标题
    ctx.font = '40px "Courier Prime", monospace, Fixedsys';
    ctx.fillStyle = config.dosColors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = config.dosColors.text;
    ctx.shadowBlur = 5;
    ctx.fillText('TYPING GAME', canvas.width/2, canvas.height/2 - 50);
    ctx.shadowBlur = 0;
    
    // 显示游戏说明
    ctx.font = '20px "Courier Prime", monospace, Fixedsys';
    ctx.fillText('PRESS SPACE OR CLICK START TO BEGIN', canvas.width/2, canvas.height/2 + 20);
    
    // 显示START GAME按钮（DOS风格）
    const button = document.createElement('button');
    button.textContent = 'START GAME';
    button.style.position = 'absolute';
    button.style.left = '50%';
    button.style.top = '60%';
    button.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(button);
    
    button.addEventListener('click', () => {
        document.body.removeChild(button);
        startGame();
    });
        
    // 添加空格键监听
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (document.body.contains(button)) {
                document.body.removeChild(button);
            }
            startGame();
        }
    });
};