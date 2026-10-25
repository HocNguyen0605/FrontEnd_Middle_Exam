//---------------------------------Giao diện
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const boardEl = document.getElementById("board");
const levelTitle = document.getElementById("levelTitle");
const scoreText = document.getElementById("scoreText");
const subtitle = document.querySelector(".subtitle");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalActions = document.getElementById("modalActions");

let currentGame = null;
//Giao diện
function renderMenu(){
    menuScreen.innerHTML = "";
    LEVELS.forEach(function(level){
        const item = document.createElement("button")
        item.className = "level-item";
        item.innerHTML= '<span class="level-box">' + level.id + "</span>" +
            '<span class="level-name">' + level.name + "</span>";
        item.addEventListener("click",function(){
            selectLevel(level)
        });
        menuScreen.appendChild(item)
    })
}
//chọn level
function selectLevel(level){
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    subtitle.classList.add("hidden");
    levelTitle.textContent = "Level"+ level.id;

    const ui = {
        updateScore: function(score, targetScore){
            scoreText.textContent= "Điểm: "+ score + "/" +targetScore
        },
        onEnd: function (isWin, message) {
            showModal(
                isWin ? "Chiến thắng!" : "Thua rồi",
                "<p>" + message + "</p>",
                [
                    { text: "Về menu", secondary: true, onClick: backToMenu },
                    { text: "Chơi lại", onClick: function () { currentGame.start(); } }
                ]
            );
        }
    }
    currentGame = level.createGame(level, boardEl, ui);

    const rulesHtml = "<ul>" + level.rules.map(function(line){
        return "<li>" + line + "</li>"
    }).join("") + "</ul>";
    showModal("Luật chơi", rulesHtml, [
        {
            text: "Tôi hiểu", onClick: function () {
                currentGame.start()
            }
        }
    ]);
}
//trở về menu
function backToMenu() {
    if (currentGame) currentGame.stop();
    currentGame = null;
    hideModal();
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    subtitle.classList.remove("hidden");
}

document.getElementById("backBtn").addEventListener("click", backToMenu);
//Hiển thị modal
function showModal(title, bodyHtml, buttons) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalActions.innerHTML = "";
    buttons.forEach(function (info) {
        const btn = document.createElement("button");
        btn.className = "btn" + (info.secondary ? " secondary" : "");
        btn.textContent = info.text;
        btn.addEventListener("click", function () {
            hideModal();
            info.onClick();
        });
        modalActions.appendChild(btn);
    });
    modal.classList.remove("hidden");
}

function hideModal() {
    modal.classList.add("hidden");
}
//---------------------------------Logic game
const ROWS = 18;
const COLS = 18;
let SPEED =150;
const SCORE = 10;
const DIRECTIONS ={
    up: {
        x: 0,
        y: -1,
    },
    down: {
        x: 0,
        y: 1,
    },
    left: {
        x: -1,
        y: 0,
    },
    right: {
        x: 1,
        y: 0,
    },
}
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
//Biến dđạc trưng cho level 3
const INVISIBLE_TIME =3000
//Biến đặc trưng cho level 6
const GHOST_DELAY = 12;
const GHOST_LENGTH = 3;
// Các lelvel game
const LEVELS = [
    {
        id: 1,
        name:"Kinh điển",
        ready: true,
        rules: [
            "Dùng phím mũi tên hoặc W, A, S, D để điều khiển rắn.",
            "Ăn mồi đỏ để rắn dài ra và được 1 điểm.",
            "Đâm vào tường hoặc cắn vào thân mình là thua.",
            "Đạt 10 điểm để thắng."
        ],
        wrapWalls: false,
        hooks: {},
        createGame: createSnakeGame
    },

    {
        id: 2,
        name: "Đảo ngược",
        ready: true,
        rules: [
            "Dùng phím mũi tên để điều khiển rắn, nhưng các phím bị đảo ngược.",
            "Bấm trái thì rắn đi phải, bấm lên thì rắn đi xuống.",
            "Ăn mồi đỏ để rắn dài ra và được 1 điểm.",
            "Đâm vào tường hoặc cắn vào thân mình là thua."
        ],
        reverseControls: true,
        hooks: {},
        createGame: createSnakeGame
    },
    {
        id: 3,
        name: "Ẩn thân",
        ready: true,
        rules: [
            "Dùng phím mũi tên để điều khiển rắn.",
            "Cứ mỗi 3 mồi sẽ có 1 mồi vàng.",
            "Ăn mồi vàng, rắn sẽ tàng hình trong 3 giây.",
            "Đâm vào tường hoặc cắn vào thân mình là thua."
        ],
        hooks: {
            onCreateFood: function(state){
                if(state.food && (state.score +1)% 3===0){
                    state.food.special = true;
                }
            },
            onEat: function(state){
                if(!state.food.special) return;
                state.hidden = true;
                clearTimeout(state.hiddenTimer);
                state.hiddenTimer = setTimeout(function(){
                    state.hidden=false
                },INVISIBLE_TIME);
            },
            onStop: function (state) {
                clearTimeout(state.hiddenTimer);
                state.hidden = false;
            }
        },
        createGame: createSnakeGame
    },
    {
        id: 4,
        name: "Thanh xà bạch xà",
        ready: true,
        rules: [
            "Có hai rắn: rắn xanh và rắn trắng, cả hai cùng chạy.",
            "Mỗi lần bấm phím sẽ điều khiển một rắn, lần lượt xanh rồi trắng.",
            "Rắn có viền vàng ở đầu là rắn sẽ nhận phím kế tiếp.",
            "Ăn mồi để cộng điểm chung cho cả hai rắn.",
            "Đụng tường, cắn mình hoặc cắn rắn kia là thua."
        ],
        hooks: {},
        createGame: createDoubleSnakeGame
    },
    {
        id: 5,
        name: "Tường ngẫu nhiên",
        ready: true,
        rules: [
            "Dùng phím mũi tên để điều khiển rắn.",
            "Mỗi lần ăn mồi, một ô tường mới sẽ mọc lên.",
            "Đâm vào tường, cắn vào thân mình hoặc ra ngoài bảng là thua."
        ],
        hooks: {
            onEat: function (state) {
                addRandomWall(state);
            }
        },
        createGame: createSnakeGame
    },
    {
        id: 6,
        name: "Bóng ma",
        ready: true,
        rules: [
            "Dùng phím mũi tên để điều khiển rắn.",
            "Một bóng ma luôn đi lại đúng đường bạn đã đi 12 bước trước.",
            "Chạm vào bóng ma là thua, nên đừng quay lại đường cũ.",
            "Đâm vào tường hoặc cắn vào thân mình cũng là thua."
        ],
        ghostDelay: GHOST_DELAY,
        hooks: {},
        createGame: createSnakeGame
    }

]

// Xây bảng
function buildBoard(board, rows, cols) {
    board.innerHTML = "";
    const grid = [];
    for (let y = 0; y < rows; y++) {
        const tr = document.createElement("tr")
        const cellRows = []
        for (let x = 0; x < cols; x++) {
            const td = document.createElement("td")
            if ((x + y) % 2 === 1) td.className = "alt";
            const inner = document.createElement("div")
            td.appendChild(inner)
            tr.appendChild(td)
            cellRows.push(inner)
        }
        board.appendChild(tr)
        grid.push(cellRows)
    }
    return grid;
}

// Kiểm tra điều kiện hợp lệ
function isSamePos(a, b) {
    return a.x === b.x && a.y === b.y;
}

function isInside(pos) {
    return pos.x >= 0 && pos.x < COLS && pos.y >= 0 && pos.y < ROWS;
}

function isOnSnake(pos, snakeParts) {
    return snakeParts.some(function (part) {
        return isSamePos(pos, part)
    })
}
//Hàm tạo tường ngẫu nhiên cho level 5
function addRandomWall(state) {
    const head = state.snake[0];
    const candidates = [];
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const pos = { x: x, y: y };
            const farFromHead = Math.abs(pos.x - head.x) + Math.abs(pos.y - head.y) >= 4;
            const onFood = state.food && isSamePos(pos, state.food);
            if (farFromHead && !onFood && !isOnSnake(pos, state.snake) && !isOnSnake(pos, state.walls)) {
                candidates.push(pos);
            }
        }
    }
    if (candidates.length === 0) return;
    const index = Math.floor(Math.random() * candidates.length);
    state.walls.push(candidates[index]);
}
//Hàm tạo ma cho level 6
function getGhostCells(history, delay) {
    const result = [];
    for (let k = 0; k < GHOST_LENGTH; k++) {
        const index = history.length - 1 - delay - k;
        if (index >= 0) result.push(history[index]);
    }
    return result;
}

// Khởi tạo game
function createSnakeGame(level, board, ui) {
    const hooks = level.hooks;
    const state = {
        snake: [],
        direction: "right",
        nextDirection: "right",
        food: null,
        score: 0,
        timerId: null,
        hidden: false,
        hiddenTimer : null,
        walls: [],
        history: [],
        ghost: [],
    };
    const cells = buildBoard(boardEl, ROWS, COLS);


//Tạo mồi
    function createFood() {
        const emptyCell = []
        for (var y = 0; y < ROWS; y++) {
            for (var x = 0; x < COLS; x++) {
                const pos = {
                    x: x,
                    y: y
                }
                if (!isOnSnake(pos, state.snake) && !isOnSnake(pos, state.walls)) {
                    emptyCell.push(pos)
                }
            }
        }
        if (emptyCell.length === 0) {
            state.food = null;
            return;
        }

        const index = Math.floor(Math.random() * emptyCell.length)
        state.food = emptyCell[index]
        if(hooks.onCreateFood) hooks.onCreateFood(state);
    }

//render state của màn chơi
    function render() {
        cells.forEach(function (row) {
            row.forEach(function (cell, index) {
                cell.className = "";
            })
        })
        state.walls.forEach(function (wall) {
            cells[wall.y][wall.x].className = "wall";
        });
        if (state.food) {
            cells[state.food.y][state.food.x].className = state.food.special ? "food special" : "food";
        }
        //Vẽ rẵn ma level 6
        state.ghost.forEach(function (g) {
            cells[g.y][g.x].className = "ghost";
        });
        // Vẽ rắn thường
        if (!state.hidden) {
            state.snake.forEach(function (snakePart, index) {
                if (index === 0) {
                    cells[snakePart.y][snakePart.x].className = "head";
                } else {
                    cells[snakePart.y][snakePart.x].className = "snake";
                }
            });
        }
    }

//step
    function step() {
        state.direction = state.nextDirection
        const move = DIRECTIONS[state.direction]
        const head = state.snake[0]
        let newHead = {
            x: head.x + move.x,
            y: head.y + move.y
        };
        if (!isInside(newHead)) {
            return endGame(false, "Rắn đụng tường")
        }
        if (isOnSnake(newHead, state.walls)) {
            return endGame(false, "Rắn đâm vào tường mới mọc.");
        }
        if (state.food !== null && isSamePos(newHead, state.food)) {
            var eat = true
        }
        const body = eat ? state.snake : state.snake.slice(0, -1)
        if (isOnSnake(newHead, body)) {
            return endGame(false, "Rắn cắn mình rồi")
        }
        state.snake.unshift(newHead);
        if (eat) {
            state.score++;
            ui.updateScore(state.score, SCORE);
            if (hooks.onEat) hooks.onEat(state);
            if (state.score >= SCORE) {
                render();
                return endGame(true, "Bạn đã đạt " + state.score + " điểm.");
            }
            createFood();
        } else {
            state.snake.pop();
        }
        //kiểm tra đụng bóng ma
        if (level.ghostDelay) {
            state.history.push(newHead);
            state.ghost = getGhostCells(state.history, level.ghostDelay);
            if (isOnSnake(newHead, state.ghost)) {
                render();
                return endGame(false, "Bóng ma đã bắt được bạn.");
            }
        }
        render();

    }

    function reset() {
        stop();
        const startY = Math.floor(ROWS / 2);
        state.walls = [];
        state.snake = [
            {x: 4, y: startY},
            {x: 3, y: startY},
            {x: 2, y: startY}
        ];
        state.direction = "right";
        state.nextDirection = "right";
        state.score = 0;
        state.history = state.snake.slice().reverse();
        state.ghost = [];
        createFood();
        ui.updateScore(state.score, SCORE);
        render();
    }

    function start() {
        reset();
        state.timerId = setInterval(step, SPEED);
    }

    function stop() {
        if (state.timerId !== null) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        if (hooks.onStop) hooks.onStop(state);
    }

    function endGame(isWin, message) {
        stop();
        render();
        ui.onEnd(isWin, message);
    }

    function setDirection(dir) {
        const realDir = level.reverseControls ? OPPOSITE[dir] : dir;
        if (realDir !== OPPOSITE[state.direction]) {
            state.nextDirection = realDir;
        }
    }
    reset();

    return { start: start, stop: stop, setDirection: setDirection };
}
//Hàm tạo game cho level 4
function createDoubleSnakeGame(level, board, ui) {
    const hooks = level.hooks || {};
    const state = {
        snakes: [],
        turn: 0,
        food: null,
        score: 0,
        timerId: null
    };
    const cells = buildBoard(board, ROWS, COLS);

    function createFood() {
        const emptyCell = [];
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const pos = { x: x, y: y };
                if (!isOnSnake(pos, state.snakes[0].parts) && !isOnSnake(pos, state.snakes[1].parts)) {
                    emptyCell.push(pos);
                }
            }
        }
        if (emptyCell.length === 0) {
            state.food = null;
            return;
        }
        const index = Math.floor(Math.random() * emptyCell.length);
        state.food = emptyCell[index];
    }

    function render() {
        cells.forEach(function (row) {
            row.forEach(function (cell) {
                cell.className = "";
            });
        });
        if (state.food) {
            cells[state.food.y][state.food.x].className = "food";
        }
        state.snakes.forEach(function (snake, i) {
            snake.parts.forEach(function (part, index) {
                let cls = index === 0 ? snake.headClass : snake.bodyClass;
                if (index === 0 && i === state.turn) cls += " active";
                cells[part.y][part.x].className = cls;
            });
        });
    }

    function step() {
        const newHeads = [];
        for (let i = 0; i < state.snakes.length; i++) {
            const snake = state.snakes[i];
            snake.direction = snake.nextDirection;
            const move = DIRECTIONS[snake.direction];
            const head = snake.parts[0];
            const newHead = { x: head.x + move.x, y: head.y + move.y };
            if (!isInside(newHead)) {
                return endGame(false, snake.name + " đụng tường.");
            }
            newHeads.push(newHead);
        }

        let eat = false;
        state.snakes.forEach(function (snake, i) {
            snake.parts.unshift(newHeads[i]);
            if (state.food !== null && isSamePos(newHeads[i], state.food)) {
                eat = true;
            } else {
                snake.parts.pop();
            }
        });

        for (let i = 0; i < state.snakes.length; i++) {
            const me = state.snakes[i];
            const other = state.snakes[1 - i];
            const head = me.parts[0];
            if (isOnSnake(head, me.parts.slice(1))) {
                render();
                return endGame(false, me.name + " cắn vào thân mình.");
            }
            if (isOnSnake(head, other.parts)) {
                render();
                return endGame(false, me.name + " cắn vào " + other.name.toLowerCase() + ".");
            }
        }

        if (eat) {
            state.score++;
            ui.updateScore(state.score, SCORE);
            if (hooks.onEat) hooks.onEat(state);
            if (state.score >= SCORE) {
                render();
                return endGame(true, "Hai rắn đã đạt " + state.score + " điểm.");
            }
            createFood();
        }
        render();
    }

    function reset() {
        stop();
        const rowA = Math.floor(ROWS / 3);
        const rowB = Math.floor(ROWS * 2 / 3);
        state.snakes = [
            {
                name: "Rắn xanh",
                parts: [{ x: 4, y: rowA }, { x: 3, y: rowA }, { x: 2, y: rowA }],
                direction: "right",
                nextDirection: "right",
                headClass: "head",
                bodyClass: "snake"
            },
            {
                name: "Rắn trắng",
                parts: [{ x: 13, y: rowB }, { x: 14, y: rowB }, { x: 15, y: rowB }],
                direction: "left",
                nextDirection: "left",
                headClass: "head-white",
                bodyClass: "snake-white"
            }
        ];
        state.turn = 0;
        state.score = 0;
        createFood();
        ui.updateScore(state.score, SCORE);
        if (hooks.onStart) hooks.onStart(state);
        render();
    }

    function start() {
        reset();
        state.timerId = setInterval(step, SPEED);
    }

    function stop() {
        if (state.timerId !== null) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        if (hooks.onStop) hooks.onStop(state);
    }

    function endGame(isWin, message) {
        stop();
        render();
        ui.onEnd(isWin, message);
    }

    function setDirection(dir) {
        const snake = state.snakes[state.turn];
        if (dir !== OPPOSITE[snake.direction]) {
            snake.nextDirection = dir;
            state.turn = 1 - state.turn;
            render();
        }
    }

    reset();

    return { start: start, stop: stop, setDirection: setDirection };
}
//-------------------------Điều khiển
const KEY_TO_DIRECTION = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
};

document.addEventListener("keydown", function(e) {
    const dir = KEY_TO_DIRECTION[e.key];
    if (!dir || !currentGame) return;
    e.preventDefault();
    currentGame.setDirection(dir);
});

renderMenu();