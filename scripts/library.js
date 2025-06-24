// Biblioteca de funciones para el juego de Sudoku
// Esta biblioteca contiene funciones para crear, validar y manipular matrices de Sudoku,
// así como para manejar la interfaz de usuario del juego.
// Importa las funciones necesarias de la biblioteca

// Crea una matriz de Sudoku con un número específico de filas y columnas
// Por defecto, crea una matriz de 9x9 con celdas vacías
export function createSudokuMatrix(rows = 9, columns = 9, value = "") {
  let matrix = [];
  for (let i = 0; i < rows; i++) {
    let row = Array(columns).fill(value);
    matrix.push(row);
  }
  return matrix;
}

// Valida si un número puede ser colocado en una celda específica de la matriz de Sudoku
// Verifica que el número no esté presente en la fila, columna y subcuadro
export function validateSudokuMatrix(matrix, row, column, number) {
  number = Number(number);

  // Validar fila
  for (let j = 0; j < 9; j++) {
    if (
      j !== column &&
      Number(matrix[row][j]) === number &&
      matrix[row][j] !== ""
    ) {
      return false;
    }
  }
  // Validar columna
  for (let i = 0; i < 9; i++) {
    if (
      i !== row &&
      Number(matrix[i][column]) === number &&
      matrix[i][column] !== ""
    ) {
      return false;
    }
  }
  // Validar subcuadro 3x3
  let subMatrixRow = Math.floor(row / 3) * 3;
  let subMatrixColumn = Math.floor(column / 3) * 3;
  for (let i = subMatrixRow; i < subMatrixRow + 3; i++) {
    for (let j = subMatrixColumn; j < subMatrixColumn + 3; j++) {
      if (
        (i !== row || j !== column) &&
        Number(matrix[i][j]) === number &&
        matrix[i][j] !== ""
      ) {
        return false;
      }
    }
  }
  return true;
}

// Mezcla un array de forma aleatoria
// Utiliza el algoritmo de Fisher-Yates para mezclar el array
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Llena la matriz de Sudoku con números del 1 al 9 de forma aleatoria
// y valida que cada número sea único en su fila, columna y subcuadro 3x3
// Utiliza un valor inicial para las celdas vacías, por defecto es una cadena
export function fillMatrix(matrix, numbers, initialValue = "") {
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

// Genera un Sudoku válido y lo devuelve como una matriz
// Utiliza los números del 1 al 9 y un valor inicial para las celdas vacías
// Por defecto, el valor inicial es una cadena vacía
// Si no se puede generar un Sudoku válido, devuelve null
export function hideNumbers(matrix, hiddenValue, difficulty, initialValue) {
  switch (difficulty) {
    case "facil":
      difficulty = 0.2; // Oculta el 20%
      break;
    case "intermedio":
      difficulty = 0.4; // Oculta el 40%
      break;
    case "dificil":
      difficulty = 0.6; // Oculta solo el 60% 
      break;
    default:
      difficulty = 0.2; // Por defecto, oculta el 20%
      break;
  }
  let totalNumbers = matrix.length ** 2;
  let hiddenCount = Math.floor(totalNumbers * difficulty);
  let attempts = 0;
  while (hiddenCount > 0 && attempts < 1000) {
    let randomRow = Math.floor(Math.random() * matrix.length);
    let randomColumn = Math.floor(Math.random() * matrix[0].length);
    if (
      matrix[randomRow][randomColumn] != initialValue &&
      matrix[randomRow][randomColumn] !== hiddenValue
    ) {
      let backup = matrix[randomRow][randomColumn];
      matrix[randomRow][randomColumn] = hiddenValue;
      // Verificar unicidad
      if (countSudokuSolutions(matrix) !== 1) {
        matrix[randomRow][randomColumn] = backup; // revertir si no es único
      } else {
        hiddenCount--;
      }
    }
    attempts++;
  }
}

// Crea una copia de la matriz de Sudoku
// Utiliza el método map para crear una nueva matriz con los mismos valores
// Esto es útil para evitar mutaciones no deseadas en la matriz original
export function copyMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

// Crea el tablero de Sudoku en el contenedor especificado
export function $createBoard(matrix, $container, matrixOriginal = null) {
  $container.innerHTML = "";
  // Crea el contenedor principal del tablero
  const $sudokuBoard = document.createElement("div");
  $sudokuBoard.className = "sudoku-board";
  const boardData = [];
  matrix.forEach((row, i) => {
    const $row = document.createElement("div");
    $row.className = "row";
    const rowData = [];
    row.forEach((value, j) => {
      const $col = document.createElement("div");
      $col.className = "col";
      $col.dataset.row = i + 1;
      $col.dataset.col = j + 1;
      $col.dataset.box = Math.floor(i / 3) * 3 + Math.floor(j / 3) + 1;
      $col.textContent = value !== "" ? value : "";
      // Bloquea celdas originales y válidas al cargar partida
      if (
        value !== "" &&
        matrixOriginal &&
        Number(value) === Number(matrixOriginal[i][j])
      ) {
        $col.setAttribute("data-locked", "true");
        $col.dataset.numberValidation = "true";
      }
      rowData.push($col);
      $row.appendChild($col);
    });
    $sudokuBoard.appendChild($row);
    boardData.push(rowData);
  });
  $container.appendChild($sudokuBoard);
  return boardData;
}

// Elimina la selección de celdas en el tablero de Sudoku
export function removeCell(columns) {
  const selectedLine = "selected-line";
  const selectedCell = "selected-cell";
  const matchCells = "matching-cells";
  columns.forEach((cell) =>
    cell.classList.remove(selectedLine, selectedCell, matchCells)
  );
}

// Selecciona una celda en el tablero de Sudoku y resalta las celdas relacionadas
// Resalta la fila, columna y subcuadro de la celda seleccionada
// También resalta las celdas que coinciden con el valor de la celda seleccionada
// Si la celda ya está seleccionada, la deselecciona y elimina el resaltado
// Utiliza una función de callback para manejar la selección de la celda
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

// Agrega un evento de teclado para permitir la entrada de números en las celdas seleccionadas
// Permite ingresar números del 1 al 9, eliminar el contenido de la celda
// y manejar celdas bloqueadas
// Utiliza una función de callback para manejar la entrada de números
export function $addNumber(getSelectedCell, getMatrix, onInput) {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  $cells.forEach((cell) => cell.setAttribute("tabindex", "0"));
  document.addEventListener("keydown", (e) => {
    const cell = getSelectedCell();
    if (!cell) return;
    if (cell.getAttribute("data-locked") === "true") return;
    const matrix = getMatrix();
    const selectedRow = parseInt(cell.dataset.row) - 1;
    const selectedColumn = parseInt(cell.dataset.col) - 1;
    if (/^[1-9]$/.test(e.key) && cell.textContent == "") {
      const selectedNumber = parseInt(e.key);
      if (typeof onInput === "function") {
        onInput(selectedRow, selectedColumn, selectedNumber, cell);
      }
    } else if (e.key == "Delete" || e.key == "Backspace") {
      cell.textContent = "";
      cell.classList.remove("invalid-cell");
      cell.removeAttribute("data-number-validation");
      cell.removeAttribute("data-locked");
      matrix[selectedRow][selectedColumn] = "";
      if (typeof onInput === "function") {
        onInput(selectedRow, selectedColumn, "", cell);
      }
    }
    e.preventDefault();
  });
}

// Agrega un teclado numérico para seleccionar números del 1 al 9
// Permite seleccionar números y colocarlos en la celda seleccionada
// Utiliza una función de callback para manejar la entrada de números
// Evita editar celdas bloqueadas
export function $addNumberKeyboard(getSelectedCell, getMatrix, onInput) {
  const $numbers = document.querySelector(".numbers");
  if (!$numbers) return;
  $numbers.addEventListener("click", (e) => {
    if (!e.target.matches(".col")) return;
    const cell = getSelectedCell();
    if (!cell) return;
    if (cell.getAttribute("data-locked") === "true") return; // <-- evita editar celdas bloqueadas
    const matrix = getMatrix();
    const selectedRow = parseInt(cell.dataset.row) - 1;
    const selectedColumn = parseInt(cell.dataset.col) - 1;
    const selectedNumber = parseInt(e.target.textContent);
    if (cell.textContent == "") {
      if (typeof onInput === "function") {
        onInput(selectedRow, selectedColumn, selectedNumber, cell);
      }
    }
  });
}

// Inicia un temporizador que actualiza el elemento de tiempo cada segundo
// Permite iniciar, pausar y reiniciar el temporizador
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

// Oculta el tablero de Sudoku al eliminar el contenido de las celdas
// Guarda el valor real de las celdas en un atributo data-real-value
export function hideBoard() {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  $cells.forEach((cell) => {
    if (cell.textContent !== "") {
      cell.dataset.realValue = cell.textContent;
      cell.textContent = "";
    }
  });
}

// Muestra el tablero de Sudoku al restaurar el contenido de las celdas
// Utiliza el atributo data-real-value para recuperar el valor original de las celdas
export function showBoard() {
  const $cells = document.querySelectorAll(".sudoku-board .col");
  $cells.forEach((cell) => {
    if (cell.dataset.realValue) {
      cell.textContent = cell.dataset.realValue;
    }
  });
}

// Limpia la selección de celdas en el tablero de Sudoku
// Elimina las clases de selección y resaltado de las celdas
export function clearSelection() {
  const $cells = document.querySelectorAll(".game-left .col");
  removeCell($cells);
}

// Guarda el estado del juego en el almacenamiento local
// Guarda la matriz de Sudoku, la matriz original, la dificultad, el tiempo, la puntuación y los errores
// Utiliza JSON para serializar el objeto del juego y almacenarlo en localStorage
export function saveGame(
  matrix,
  matrixOriginal,
  difficulty,
  time,
  score,
  errors
) {
  const game = { matrix, matrixOriginal, difficulty, time, score, errors };
  localStorage.setItem("game", JSON.stringify(game));
}

// Carga el estado del juego desde el almacenamiento local
// Recupera el objeto del juego almacenado en localStorage y lo deserializa
export function loadGame() {
  const savedGame = localStorage.getItem("game");
  if (savedGame) {
    return JSON.parse(savedGame);
  } else {
    return null;
  }
}

// Elimina el estado del juego del almacenamiento local
// Utiliza localStorage para eliminar el objeto del juego almacenado
export function deleteGame() {
  localStorage.removeItem("game");
}

// Verifica si la matriz de Sudoku está completa y es válida
// Recorre cada celda de la matriz y valida que cada número sea único en su fila, columna y subcuadro 3x3
// Si encuentra un número que no cumple con las reglas del Sudoku, devuelve false
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

// Cuenta el número de soluciones posibles para una matriz de Sudoku
export function countSudokuSolutions(matrix) {
  let count = 0;
  function solve(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j] || board[i][j] === "") {
          for (let num = 1; num <= 9; num++) {
            if (validateSudokuMatrix(board, i, j, num)) {
              board[i][j] = num;
              solve(board);
              board[i][j] = "";
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve(matrix.map((row) => row.slice()));
  return count;
}