export function createSudokuMatrix(rows = 9, columns = 9, value = 0) {
  let matrix = [];
  for (let i = 0; i < rows; i++) {
    let row = Array(columns).fill(value);
    matrix.push(row);
  }
  return matrix;
}

export function validateSudokuMatrix(matrix, row, column, number) {
  if (
    !Array.isArray(matrix) ||
    typeof row !== "number" ||
    typeof column !== "number" ||
    row < 0 ||
    column < 0 ||
    row >= matrix.length ||
    column >= matrix[0].length
  ) {
    return false;
  }
  // Validar fila
  for (let j = 0; j < matrix[row].length; j++) {
    if (
      j !== column &&
      Number(matrix[row][j]) === Number(number) &&
      matrix[row][j] !== "" &&
      matrix[row][j] !== 0
    )
      return false;
  }
  // Validar columna
  for (let i = 0; i < matrix.length; i++) {
    if (
      i !== row &&
      Number(matrix[i][column]) === Number(number) &&
      matrix[i][column] !== "" &&
      matrix[i][column] !== 0
    )
      return false;
  }
  // Validar subcuadro 3x3
  let subMatrixRow = Math.floor(row / 3) * 3;
  let subMatrixColumn = Math.floor(column / 3) * 3;
  for (let i = subMatrixRow; i < subMatrixRow + 3; i++) {
    for (let j = subMatrixColumn; j < subMatrixColumn + 3; j++) {
      if (
        (i !== row || j !== column) &&
        Number(matrix[i][j]) === Number(number) &&
        matrix[i][j] !== "" &&
        matrix[i][j] !== 0
      )
        return false;
    }
  }
  return true;
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function fillMatrix(matrix, numbers, initialValue) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === initialValue) {
        let copiedNumbers = numbers.slice();
        shuffleArray(copiedNumbers);
        for (let number of copiedNumbers) {
          if (validateSudokuMatrix(matrix, i, j, number)) {
            matrix[i][j] = number;
            if (fillMatrix(matrix, numbers, initialValue)) {
              return true;
            }
            matrix[i][j] = initialValue;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function hideNumbers(matrix, hiddenValue, difficulty, initialValue) {
  switch (difficulty) {
    case "facil":
      difficulty = 0.2;
      break;
    case "intermedio":
      difficulty = 0.4;
      break;
    case "dificil":
      difficulty = 0.6;
      break;
    default:
      difficulty = 0.2;
      break;
  }
  let totalNumbers = matrix.length ** 2;
  let hiddenCount = Math.floor(totalNumbers * difficulty);
  for (let i = 0; i < hiddenCount; i++) {
    while (true) {
      let randomRow = Math.floor(Math.random() * matrix.length);
      let randomColumn = Math.floor(Math.random() * matrix[0].length);
      if (matrix[randomRow][randomColumn] != initialValue) {
        matrix[randomRow][randomColumn] = hiddenValue;
        break;
      }
    }
  }
}

export function copyMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

export function $createBoard(matrix, $container) {
  const $boardContainer = document.createElement("div");
  $boardContainer.classList.add("sudoku-board");
  const fragment = document.createDocumentFragment();
  const boardData = [];
  matrix.forEach((row, i) => {
    const $row = document.createElement("div");
    $row.classList.add("row", `row-${i + 1}`);
    const rowData = [];
    row.forEach((value, j) => {
      const $col = document.createElement("div");
      $col.classList.add("col", `col-${j + 1}`);
      $col.dataset.row = i + 1;
      $col.dataset.col = j + 1;
      $col.dataset.box = `${Math.floor(i / 3) + 1}-${Math.floor(j / 3) + 1}`;
      if (value !== 0 && value !== "" && value != null) {
        $col.dataset.numberValidation = "true";
      }
      $col.textContent = value;
      $row.appendChild($col);
      rowData.push($col);
    });
    fragment.appendChild($row);
    boardData.push(rowData);
  });
  $boardContainer.appendChild(fragment);
  $container.appendChild($boardContainer);
  return boardData;
}

export function removeCell(columns) {
  const selectedLine = "selected-line";
  const selectedCell = "selected-cell";
  const matchCells = "matching-cells";
  columns.forEach((cell) =>
    cell.classList.remove(selectedLine, selectedCell, matchCells)
  );
}

export function $selectCell(onSelect, isEnabled) {
  const selectedLine = "selected-line";
  const selectedCell = "selected-cell";
  const matchCells = "matching-cells";
  const $cells = document.querySelectorAll(".game-left .col");
  let currentCell = null;
  $cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      if (!isEnabled()) return;
      const selectedRow = cell.dataset.row;
      const selectedColumn = cell.dataset.col;
      const selectedBox = cell.dataset.box;
      const selectedValue = cell.textContent;
      if (cell.classList.contains(selectedCell)) {
        removeCell($cells);
        currentCell = null;
        onSelect(null);
        return;
      }
      removeCell($cells);
      $cells.forEach((col) => {
        if (
          col.dataset.row == selectedRow ||
          col.dataset.col == selectedColumn ||
          col.dataset.box == selectedBox
        ) {
          col.classList.add(selectedLine);
        }
        if (col.textContent == selectedValue && selectedValue !== "") {
          col.classList.add(matchCells);
        }
      });
      cell.classList.add(selectedCell);
      currentCell = cell;
      onSelect(cell);
    });
  });
}

export function $addNumber(getSelectedCell, getMatrix, onInput) {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  const classInvalidCell = "invalid-cell";
  $cells.forEach((cell) => cell.setAttribute("tabindex", "0"));
  document.addEventListener("keydown", (e) => {
    const cell = getSelectedCell();
    if (!cell) return;
    const matrix = getMatrix();
    const selectedRow = parseInt(cell.dataset.row) - 1;
    const selectedColumn = parseInt(cell.dataset.col) - 1;
    if (/^[1-9]$/.test(e.key) && cell.textContent == "") {
      const selectedNumber = parseInt(e.key);

      // VALIDAR ANTES DE PONER EN LA MATRIZ
      const isValid = validateSudokuMatrix(
        matrix,
        selectedRow,
        selectedColumn,
        selectedNumber
      );
      if (isValid) {
        cell.textContent = selectedNumber;
        cell.dataset.numberValidation = "true";
        cell.classList.remove(classInvalidCell);
        matrix[selectedRow][selectedColumn] = selectedNumber;
      } else {
        cell.textContent = selectedNumber;
        cell.classList.add(classInvalidCell);
      }
      if (typeof onInput === "function") {
        onInput(selectedRow, selectedColumn, selectedNumber, isValid);
      }
    } else if (
      (e.key == "Delete" || e.key == "Backspace") &&
      cell.dataset.numberValidation != "true"
    ) {
      cell.textContent = "";
      cell.classList.remove(classInvalidCell);
      matrix[selectedRow][selectedColumn] = "";
    }
    e.preventDefault();
  });
}

export function $addNumberKeyboard(getSelectedCell, getMatrix, onInput) {
  const $numbers = document.querySelector(".numbers");
  const classInvalidCell = "invalid-cell";
  if (!$numbers) return;
  $numbers.addEventListener("click", (e) => {
    if (!e.target.matches(".col")) return;
    const cell = getSelectedCell();
    if (!cell) return;
    const matrix = getMatrix();
    const selectedRow = parseInt(cell.dataset.row) - 1;
    const selectedColumn = parseInt(cell.dataset.col) - 1;
    const selectedNumber = parseInt(e.target.textContent);
    if (cell.textContent == "") {
      // VALIDAR ANTES DE PONER EN LA MATRIZ
      const isValid = validateSudokuMatrix(
        matrix,
        selectedRow,
        selectedColumn,
        selectedNumber
      );
      if (isValid) {
        cell.textContent = selectedNumber;
        cell.dataset.numberValidation = "true";
        cell.classList.remove(classInvalidCell);
        matrix[selectedRow][selectedColumn] = selectedNumber;
      } else {
        cell.textContent = selectedNumber;
        cell.classList.add(classInvalidCell);
      }
      if (typeof onInput === "function") {
        onInput(selectedRow, selectedColumn, selectedNumber, isValid);
      }
    }
  });
}

export function startTimer($timeElement, initialSeconds = 0) {
  let totalSeconds = initialSeconds;
  let interval = null;
  const updateTime = () => {
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let formattedTime = "";
    if (hours > 0) {
      formattedTime =
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
    } else {
      formattedTime =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
    }
    $timeElement.textContent = formattedTime;
  };
  const start = () => {
    if (interval) return interval;
    updateTime();
    interval = setInterval(() => {
      totalSeconds++;
      updateTime();
    }, 1000);
    return interval;
  };
  const pause = () => {
    clearInterval(interval);
    interval = null;
    return false;
  };
  const reset = () => {
    pause();
    totalSeconds = 0;
    updateTime();
    return false;
  };
  return { start, pause, reset };
}

export function hideBoard() {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  $cells.forEach((cell) => {
    if (cell.textContent !== "") {
      cell.dataset.realValue = cell.textContent;
      cell.textContent = "";
    }
  });
}

export function showBoard() {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  $cells.forEach((cell) => {
    if (cell.dataset.realValue) {
      cell.textContent = cell.dataset.realValue;
    }
  });
}

export function clearSelection() {
  const $cells = document.querySelectorAll(".game-left .col");
  removeCell($cells);
}

export function saveGame(matrix, difficulty, time, score, errors) {
  const game = { matrix, difficulty, time, score, errors };
  localStorage.setItem("game", JSON.stringify(game));
}

export function loadGame() {
  const savedGame = localStorage.getItem("game");
  if (savedGame) {
    return JSON.parse(savedGame);
  } else {
    return null;
  }
}

export function deleteGame() {
  localStorage.removeItem("game");
}

export function isSudokuCompleteAndValid(matrix) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = matrix[i][j];
      if (!value || !validateSudokuMatrix(matrix, i, j, value)) {
        return false;
      }
    }
  }
  return true;
}