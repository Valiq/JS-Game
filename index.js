// Определяем размеры игрового поля
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;

// Определяем состояние клавиш движения
var keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

var enemyShootInterval = 2000;
var playerShootInterval = 700;
var lastPlayerShootTime = 0;
var flagToShoot = false;

// Создаем игровое поле
var canvas = document.getElementById('canvas');
canvas.width = canvasWidth;
canvas.height = canvasHeight;
document.body.appendChild(canvas);
var context = canvas.getContext('2d');

// Определяем скорость игрока и врагов
var playerSpeed = 2;
var playerBulletSpeed = 7;
var enemyBulletSpeed = 4;
var enemySpeed = 2;
var scoure = 0;
var modCounter = 10;
var shieldFallConroller = false;

var gameOver = false;
var hardMod = false;

// Определяем игровые объекты
var newPlayer = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    width: 25,
    height: 25,
    color: 'blue',
    weapon: 'pistol',
    shieldViseble: false,
    shieldEnabled: false,
    teleportEnabled: true,
    buff: false,
    blinkAnimation: false,
    circleR: 12
};

var player = newPlayer;

var superBullet = {
    x: Math.random() * (canvasWidth - 20) + 10,
    y: Math.random() * (canvasHeight - 20) + 10,
    width: 6,
    height: 6,
    color: 'purple',
    spawn: true,
    trackerX: 0,
    trackerY: 0
}

var bullets = [];
var enemies = [];
var deaths = [];

// Функция для создания врагов
function createEnemy() {
    var enemy = {
        x: Math.random() * (canvasWidth - 20) + 10,
        y: Math.random() * (canvasHeight - 20) + 10,
        width: 25,
        height: 25,
        color: 'red',
        weapon: 'rifle',
        lastShooting: 0
    };

    if (Math.abs(enemy.x - player.x) > 200)
        enemies.push(enemy);
}

// Функция для обновления игры
function update() {

    if (gameOver) {
        alert("Game Over");
        restartGame();
        return;
    }

    // Очищаем игровое поле
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Обновляем игрока
    context.fillStyle = player.color;
    context.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

    if (player.shieldViseble) {
        context.strokeStyle = 'gold';
        context.lineWidth = 4;
        context.strokeRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    }

    if (player.blinkAnimation) {
        context.beginPath();
        context.arc(player.x, player.y, player.circleR, 0, 2 * Math.PI); // Создаем окружность
        context.lineWidth = 4;         // Задаем толщину линии контура
        context.strokeStyle = 'gold'; // Задаем цвет контура
        context.stroke();               // Рисуем контур окружности
        context.closePath();
    }

    // Обновляем пули
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];

        if (bullet.type === "enemy") {
            context.fillStyle = 'black';
            context.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
        }

        if (bullet.type === "player") {
            if (!bullet.superBullet) {
                context.fillStyle = player.color;
                context.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
            }

            if (bullet.superBullet) {
                context.fillStyle = superBullet.color;
                context.fillRect(bullet.x - 2, bullet.y - 2, superBullet.width, superBullet.height);
            }
        }

        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;

        // Проверяем столкновение пули с врагами
        for (var j = 0; j < enemies.length; j++) {
            var enemy = enemies[j];
            if (
                bullet.type === "player" &&
                bullet.x >= enemy.x - enemy.width / 2 &&
                bullet.x <= enemy.x + enemy.width / 2 &&
                bullet.y >= enemy.y - enemy.height / 2 &&
                bullet.y <= enemy.y + enemy.height / 2
            ) {
                // Удаляем попавший выстрел врага
                if (!bullet.superBullet) {
                    bullets.splice(i, 1);
                    i--;
                }

                var death = {
                    x: enemy.x,
                    y: enemy.y,
                    time: Date.now()
                };

                deaths.push(death);

                // Удаляем убитого врага
                enemies.splice(j, 1);
                // Увеличиваем счет и обновляем отображение
                scoure++;
                updateScore();
            }
        }

        //Проверка на условие со счетом игрока
        if (((scoure + 1) % modCounter) === 0) {
            if (enemyShootInterval > 400) {
                enemyShootInterval -= 200;
            }

            player.shieldViseble = true;
            player.shieldEnabled = true;
            modCounter += 10;
        }

        //Проверка на поподание врага
        if (bullet.type === "enemy") {

            if (player.blinkAnimation) {
                // Проверяем, попал ли пуля внутрь круга блинка
                var distX = Math.abs(player.x - (bullet.x + 4 / 2));
                var distY = Math.abs(player.y - (bullet.y + 4 / 2));
                var dist = Math.sqrt(distX * distX + distY * distY);

                if (player.blinkAnimation && dist < player.circleR - 4 / 2) {
                    // Пуля попала внутрь круга, убираем
                    bullets.splice(i, 1);
                    i--;
                }
            }

            if (bullet.x >= player.x - player.width / 2 &&
                bullet.x <= player.x + player.width / 2 &&
                bullet.y >= player.y - player.height / 2 &&
                bullet.y <= player.y + player.height / 2
            ) {
                if (!player.shieldEnabled) {
                    gameOver = true;
                }
                else {
                    bullets.splice(i, 1);
                    i--;

                    if (!shieldFallConroller) {
                        shieldFallConroller = true;
                        var blinkInterval = setInterval(function () {
                            player.shieldViseble = !player.shieldViseble; // Переключаем видимость щита
                        }, 300);

                        setTimeout(function () {
                            clearInterval(blinkInterval); // Останавливаем интервал
                            player.shieldViseble = false; // Выключаем щит
                            player.shieldEnabled = false;
                            shieldFallConroller = false;
                        }, 1500);
                    }
                }
            }
        }

        // Удаляем пулю, если она выходит за пределы игрового поля
        if (
            bullet.x < 0 ||
            bullet.x > canvasWidth ||
            bullet.y < 0 ||
            bullet.y > canvasHeight
        ) {
            bullets.splice(i, 1);
            i--;
        }
    }

    for (var l = 0; l < deaths.length; l++) {
        var death = deaths[l];

        var currentTime = Date.now();
        if ((currentTime - death.time) < 2000) {
            // Задаем цвет и толщину линии
            context.strokeStyle = "red";
            context.lineWidth = 5;

            // Начинаем рисовать крест
            context.beginPath();

            context.moveTo(death.x - 10, death.y + 10);
            context.lineTo(death.x + 10, death.y - 10);

            // Рисуем вторую линию
            context.moveTo(death.x + 10, death.y + 10);
            context.lineTo(death.x - 10, death.y - 10);

            // Завершаем рисование креста
            context.closePath();

            // Отображаем крест на холсте
            context.stroke();
        }
        else {
            deaths.splice(l, 1);
            l--;
        }
    }

    // Обновляем врагов
    for (var k = 0; k < enemies.length; k++) {
        var enemy = enemies[k];
        context.fillStyle = enemy.color;
        context.fillRect(
            enemy.x - enemy.width / 2,
            enemy.y - enemy.height / 2,
            enemy.width,
            enemy.height
        );

        // Перемещаем врагов в направлении игрока
        var dx = player.x - enemy.x;
        var dy = player.y - enemy.y;
        var angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(angle) * enemySpeed;
        enemy.y += Math.sin(angle) * enemySpeed;

        //открываем огонь
        if (checkEnemyShooting(enemy)) {
            shootBulletFromEnemy(enemy);
        }
    }

    // Создаем случайным образом новых врагов
    if (Math.random() < 0.015) {
        createEnemy();
    }

    //проверка на преобретении баффа игроком
    if (superBullet.x >= player.x - player.width &&
        superBullet.x <= player.x + player.width &&
        superBullet.y >= player.y - player.height &&
        superBullet.y <= player.y + player.height) {
        player.buff = true;
        playerShootInterval = 350;
        superBullet.spawn = false;

        setTimeout(function () {
            player.buff = false;
            playerShootInterval = 700;
        }, 15000);
    }

    if (superBullet.spawn) {
        context.beginPath();
        context.arc(superBullet.x, superBullet.y, 10, 0, 2 * Math.PI);
        context.fillStyle = superBullet.color;
        context.fill();
        context.closePath();
    }

    // Обновляем координаты игрока на основе нажатых клавиш
    updatePlayerPosition();

    if (gameOver) {
        context.font = '24px bold Arial';  // Задаем шрифт и размер текста
        context.fillStyle = 'blue';
        context.fillText('RIP', player.x - 17, player.y - 12);
    }

    // Вызываем функцию update() снова через некоторое время
    requestAnimationFrame(update);
}

function restartGame() {
    location.reload();
}

function updateScore() {
    var scoreElement = document.getElementById('score');
    scoreElement.innerText = scoure;
}

// Функция для обработки нажатия клавиш
function handleKeyDown(event) {
    if (event.key in keys) {
        keys[event.key] = true;
    }
}

// Функция для обработки отпускания клавиш
function handleKeyUp(event) {
    if (event.key in keys) {
        keys[event.key] = false;
    }
}

// Функция для обновления координат игрока
function updatePlayerPosition() {
    if (keys.ArrowUp || keys.w) {
        player.y -= playerSpeed;
    }
    if (keys.ArrowDown || keys.s) {
        player.y += playerSpeed;
    }
    if (keys.ArrowLeft || keys.a) {
        player.x -= playerSpeed;
    }
    if (keys.ArrowRight || keys.d) {
        player.x += playerSpeed;
    }

    // Проверяем границы экрана
    if (player.x - player.width / 2 < 0) {
        player.x = player.width / 2;
    } else if (player.x + player.width / 2 > canvasWidth) {
        player.x = canvasWidth - player.width / 2;
    }

    if (player.y - player.height / 2 < 0) {
        player.y = player.height / 2;
    } else if (player.y + player.height / 2 > canvasHeight) {
        player.y = canvasHeight - player.height / 2;
    }
}

// Проверяем время между выстрелами игрока
function checkPlayerShooting() {
    var currentTime = Date.now();
    if (keys.MouseLeft && currentTime - lastPlayerShootTime > playerShootInterval) {
        lastPlayerShootTime = currentTime;
        return true;
    }
    else {
        return false;
    }
}

// Проверяем время между выстрелами врагов
function checkEnemyShooting(enemy) {
    var currentTime = Date.now();
    if (currentTime - enemy.lastShooting > enemyShootInterval) {
        enemy.lastShooting = currentTime;
        return true;
    }
    else {
        return false;
    }
}

// Функция для обработки нажатия кнопки мыши
function handleMouseDown(event) {
    if (event.button === 0) { // Левая кнопка мыши
        keys.MouseLeft = true;

        if (checkPlayerShooting())
            shootBullet(event.clientX, event.clientY);
    }

    if (event.button === 2) { // Правая кнопка мыши
        if (player.teleportEnabled) {
            player.x = event.clientX;
            player.y = event.clientY;

            player.teleportEnabled = false;
            var scoreElement = document.getElementById('time');
            scoreElement.style.color = 'red';

            player.blinkAnimation = true;
            var blinkAnimationInterval = setInterval(function () {
                player.circleR += 1; // Увеличеваем радиус круга   
            }, 10);

            setTimeout(function () {
                clearInterval(blinkAnimationInterval); // Останавливаем интервал
                player.blinkAnimation = false; // Выключаем анимацию     
                player.circleR = 12;
            }, 500);

            var time = 10;
            var teleportInterval = setInterval(function () {
                time -= 0.01; // Уменьшаем время перезарядки телепорта   
                scoreElement.innerText = time.toFixed(2);
            }, 10);

            setTimeout(function () {
                clearInterval(teleportInterval); // Останавливаем интервал
                player.teleportEnabled = true; // Выключаем телепорт       
                scoreElement.style.color = 'forestgreen';
                scoreElement.innerText = 'READY';
            }, 10000);
        }
    }
}

// Функция для обработки отпускания кнопки мыши
function handleMouseUp(event) {
    if (event.button === 0) { // Левая кнопка мыши
        keys.MouseLeft = false;
    }
}

// Функция для выстрела пули игрока
function shootBullet(clientX, clientY) {
    var mouseX = clientX - canvas.getBoundingClientRect().left;
    var mouseY = clientY - canvas.getBoundingClientRect().top;

    var dx = mouseX - player.x;
    var dy = mouseY - player.y;
    var angle = Math.atan2(dy, dx);

    var bullet = {
        x: player.x,
        y: player.y,
        speedX: Math.cos(angle) * playerBulletSpeed,
        speedY: Math.sin(angle) * playerBulletSpeed,
        type: "player",
        superBullet: false
    };

    if (player.buff) {
        bullet.superBullet = true;
        bullet.speedX *= 2;
        bullet.speedY *= 2;
    }

    bullets.push(bullet);
}

// Функция для выстрела пули врага
function shootBulletFromEnemy(enemy) {
    var dx = player.x - enemy.x;
    var dy = player.y - enemy.y;
    var angle = Math.atan2(dy, dx);

    var bullet = {
        x: enemy.x,
        y: enemy.y,
        speedX: Math.cos(angle) * enemyBulletSpeed,
        speedY: Math.sin(angle) * enemyBulletSpeed,
        type: "enemy",
        superBullet: false
    };

    bullets.push(bullet);
}

document.addEventListener('contextmenu', function (event) {
    event.preventDefault(); // Предотвращаем действие по умолчанию
});

// Обработчики событий
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);

// Запускаем игру
update();

setInterval(function () {
    superBullet.spawn = true;
    superBullet.x = Math.random() * (canvasWidth - 20) + 10;
    superBullet.y = Math.random() * (canvasHeight - 20) + 10;
}, 45000);

///////////////////////////////////////////////////////////////////////////////////////////////////