class Minesweeper {
    constructor() {
        this.board = [];
        this.rows = 9;
        this.cols = 9;
        this.mines = 10;
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.flagsPlaced = 0;
        this.boardElement = document.getElementById('gameBoard');
        this.mineCounterElement = document.getElementById('mineCounter');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.resetButton = document.getElementById('resetButton');
        this.initEventListeners();
        this.newGame();
    }
    
    initEventListeners() {
        this.resetButton.addEventListener('click', () => this.newGame());
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });
    }
    
    setDifficulty(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.rows = 9;
                this.cols = 9;
                this.mines = 10;
                break;
            case 'medium':
                this.rows = 16;
                this.cols = 16;
                this.mines = 40;
                break;
            case 'hard':
                this.rows = 16;
                this.cols = 30;
                this.mines = 99;
                break;
        }
        this.newGame();
    }
    
    newGame() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimer();
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagsPlaced = 0;
        this.updateMineCounter();
        this.gameStatusElement.textContent = '';
        this.gameStatusElement.className = 'game-status';
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.renderBoard();
    }
    
    generateMines(firstRow, firstCol) {
        let minesPlaced = 0;
        const safeZone = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const row = firstRow + i;
                const col = firstCol + j;
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    safeZone.push(`${row},${col}`);
                }
            }
        }
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (!safeZone.includes(`${row},${col}`) && this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;
            }
        }
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] !== -1) {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols && this.board[ni][nj] === -1) {
                                count++;
                            }
                        }
                    }
                    this.board[i][j] = count;
                }
            }
        }
    }
    
    renderBoard() {
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        this.boardElement.innerHTML = '';
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                if (this.revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (this.board[i][j] === -1) {
                        cell.classList.add('mine');
                    } else if (this.board[i][j] > 0) {
                        cell.textContent = this.board[i][j];
                        this.setNumberColor(cell, this.board[i][j]);
                    }
                } else if (this.flagged[i][j]) {
                    cell.classList.add('flagged');
                }
                cell.addEventListener('click', (e) => this.handleClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    setNumberColor(cell, number) {
        const colors = {
            1: '#0206f2',
            2: '#097f22',
            3: '#f2051e',
            4: '#020872',
            5: '#880000',
            6: '#008785',
            7: '#000000',
            8: '#4f0070'
        };
        cell.style.color = colors[number] || '#000';
        cell.style.fontWeight = 'bold';
        cell.dataset.number = number;
    }
    
    handleClick(e) {
        if (this.gameOver || this.gameWon) return;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        if (this.flagged[row][col]) return;
        if (this.firstClick) {
            this.startTimer();
            this.generateMines(row, col);
            this.firstClick = false;
            this.revealCell(row, col);
            this.renderBoard();
            return;
        }
        if (this.revealed[row][col] && this.board[row][col] > 0) {
            this.handleNumberClick(row, col);
        } else {
            this.revealCell(row, col);
        }
        this.renderBoard();
        this.checkWinCondition();
    }
    
    handleNumberClick(row, col) {
        let flagsAround = 0;
        let minesAround = this.board[row][col];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                    if (this.flagged[newRow][newCol]) {
                        flagsAround++;
                    }
                }
            }
        }
        if (flagsAround === minesAround && flagsAround > 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                        if (!this.flagged[newRow][newCol] && !this.revealed[newRow][newCol]) {
                            this.revealCell(newRow, newCol);
                        }
                    }
                }
            }
        }
    }
    
    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver || this.gameWon || this.firstClick) return;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        if (!this.revealed[row][col]) {
            if (!this.flagged[row][col] && this.flagsPlaced < this.mines) {
                this.flagged[row][col] = true;
                this.flagsPlaced++;
            } else if (this.flagged[row][col]) {
                this.flagged[row][col] = false;
                this.flagsPlaced--;
            }
            this.updateMineCounter();
            this.renderBoard();
            this.checkWinCondition();
        }
    }
    
    checkWinCondition() {
        if (this.gameOver || this.gameWon) return;
        let allSafeRevealed = true;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] !== -1 && !this.revealed[i][j]) {
                    allSafeRevealed = false;
                    break;
                }
            }
            if (!allSafeRevealed) break;
        }
        let allMinesFlagged = true;
        if (this.flagsPlaced === this.mines) {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j] === -1 && !this.flagged[i][j]) {
                        allMinesFlagged = false;
                        break;
                    }
                    if (this.board[i][j] !== -1 && this.flagged[i][j]) {
                        allMinesFlagged = false;
                        break;
                    }
                }
                if (!allMinesFlagged) break;
            }
        } else {
            allMinesFlagged = false;
        }
        if (allSafeRevealed || allMinesFlagged) {
            this.gameWon = true;
            this.stopTimer();
            this.gameStatusElement.textContent = 'ПОБЕДА!';
            this.gameStatusElement.classList.add('win');
            if (allMinesFlagged && !allSafeRevealed) {
                this.revealAllSafeCells();
            } else {
                this.revealAllMines();
            }
        }
    }
    
    revealAllSafeCells() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] !== -1) {
                    this.revealed[i][j] = true;
                }
            }
        }
        this.renderBoard();
    }
    
    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
            this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }
        this.revealed[row][col] = true;
        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.stopTimer();
            this.gameStatusElement.textContent = 'ПОРАЖЕНИЕ';
            this.gameStatusElement.classList.add('lose');
            this.revealAllMines();
            this.renderBoard();
            return;
        }
        if (this.board[row][col] === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i !== 0 || j !== 0) {
                        this.revealCell(row + i, col + j);
                    }
                }
            }
        }
    }
    
    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] === -1) {
                    this.revealed[i][j] = true;
                }
            }
        }
        this.renderBoard();
    }
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
    }
    
    updateMineCounter() {
        const remaining = this.mines - this.flagsPlaced;
        this.mineCounterElement.textContent = remaining.toString().padStart(3, '0');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});