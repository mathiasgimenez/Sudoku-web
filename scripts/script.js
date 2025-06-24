import {
  $addNumber,
  $addNumberKeyboard,
  $createBoard,
  $selectCell,
  copyMatrix,
  createSudokuMatrix,
  saveGame,
  loadGame,
  deleteGame,
  startTimer,
  clearSelection,
  fillMatrix,
  showBoard,
  hideNumbers,
  hideBoard,
  validateSudokuMatrix,
  isSudokuCompleteAndValid,
  countSudokuSolutions,
} from "./library.js";
import themeMode from "./theme-mode.js";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $id = (selector) => document.getElementById(selector);

  themeMode();

  let matrix,
    matrixCopy,
    matrixOriginal,
    errorCounter = 0,
    currentDifficulty = "facil";
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let selectedCell = null;
  let interactionEnabled = true;
  let timerState = false;
  let timer = null;

  const $board = $(".board");
  const $modalNewGame = $id("modal-new-game");
  const $modalWelcome = $id("modal-welcome");
  const $modalFinishGame = $id("modal-finish-game");
  const $finishDetails = $id("finish-details");
  const $btnNewGameFinish = $id("btn-new-game-finish");

  const $modalError = $id("modal-error");
  const $btnErrorRestart = $id("btn-error-restart");

  const $btnCloseModal = $id("close-modal");
  const $btnReturnGame = $id("btn-return-game");
  const $btnRestart = $id("btn-restart");
  const $btnNewGameTrigger = $(".new-game");
  const $difficultyOptions = document.querySelectorAll(".btn-difficulty");
  const $btnContinueGame = $id("btn-continue-game");
  const $btnNewGameWelcome = $id("btn-new-game");
  const $errors = $id("errors");
  const $points = $id("points");
  const $bestScore = $id("best-score");
  const $displayTime = $id("time");
  const $btnPause = $id("btn-pause");
  const $btnPlay = $id("btn-play");
  const $textTime = $id("text-time");

  let bestScore = localStorage.getItem("bestScore") || 0;
  $bestScore.textContent = bestScore;

  const maxErrors = 5;

  function getInitialScore() {
    return 1000;
  }

  function updateScoreOnCorrect() {
    let pts = parseInt($points.textContent) || 0;
    let pointsToAdd = 0;

    switch (currentDifficulty) {
      case "facil":
        pointsToAdd = 10;
        break;
      case "intermedio":
        pointsToAdd = 20;
        break;
      case "dificil":
        pointsToAdd = 30;
        break;
      default:
        pointsToAdd = 10;
        break;
    }

    pts += pointsToAdd;
    $points.textContent = pts;
  }

  function updateScoreOnError() {
    let pts = parseInt($points.textContent) || 0;
    pts = Math.max(0, pts - 100);
    $points.textContent = pts;
  }

  function showFinishModal() {
    interactionEnabled = false;
    if (timer) timer.pause();
    timerState = false;
    updateTimeState();
    hideBoard();

    if ($btnReturnGame) $btnReturnGame.style.display = "none";
    if ($btnCloseModal) $btnCloseModal.style.display = "none";

    const time = $displayTime.textContent;
    const score = $points.textContent;

    if (parseInt(score) > parseInt(bestScore)) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
      $bestScore.textContent = bestScore;
    }

    $finishDetails.textContent = `Tiempo: ${time} | Puntaje: ${score}`;
    $modalFinishGame.style.display = "flex";
  }

  function showErrorModal() {
    interactionEnabled = false;
    if (timer) timer.pause();
    timerState = false;
    updateTimeState();
    hideBoard();

    $modalError.style.display = "flex";
    if ($btnReturnGame) $btnReturnGame.style.display = "none";
  }

  function hideModal($modal) {
    $modal.style.display = "none";
  }

  function resetNewGameModal() {
    const $msg = $modalNewGame.querySelector("#error-message");
    if ($msg) $msg.remove();
  }

  function createAndSelectBoard(matrixCopy) {
    $board.innerHTML = "";
    $createBoard(matrixCopy, $board, matrixOriginal);
    $selectCell(
      (cell) => {
        selectedCell = cell;
        marcarSeleccionYCoincidencias(cell);
      },
      () => interactionEnabled
    );
    setTimeout(updateNumberButtons, 0);
  }

  function activeModal($modal) {
    clearSelection();
    $modal.style.display = "flex";
    interactionEnabled = false;
    if (timer) timer.pause();
    hideBoard();
    timerState = false;
    updateTimeState();
    if ($btnRestart) $btnRestart.style.display = "none";
  }

  function disableModal($modal) {
    $modal.style.display = "none";
    interactionEnabled = true;
    timerState = true;
    if (timer) timer.start();
    showBoard();
    updateTimeState();
    if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
    if ($btnReturnGame) $btnReturnGame.style.display = "";
    updateNumberButtons();
  }

  const $difficultyDisplay = $id("difficulty");
  let savedGame = loadGame();
  let savedTime = "00:00";

  if (savedGame) {
    currentDifficulty = savedGame.difficulty;
    $difficultyDisplay.textContent = currentDifficulty;
    let initPts = parseInt(savedGame.score);
    if (isNaN(initPts)) initPts = getInitialScore();
    $points.textContent = initPts;
    savedTime = savedGame.time;
    matrixCopy = savedGame.matrix;
    matrixOriginal = savedGame.matrixOriginal;
    matrix = copyMatrix(matrixCopy);
    errorCounter = savedGame.errors != null ? savedGame.errors : 0;
    if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
    createAndSelectBoard(matrixCopy);
    hideBoard();
    updateDisplayTime(timeStringToSeconds(savedTime));
    const savedSeconds = timeStringToSeconds(savedTime);
    timer = startTimer($displayTime, savedSeconds);
    timerState = false;
    updateTimeState();
    activeModal($modalWelcome);
  } else {
    matrix = createSudokuMatrix();
    fillMatrix(matrix, numbers, "");
    matrixCopy = copyMatrix(matrix);
    hideNumbers(matrixCopy, "", currentDifficulty, "");
    $points.textContent = getInitialScore();
    createAndSelectBoard(matrixCopy);
    updateDisplayTime(0);
    timer = startTimer($displayTime, 0);
    timerState = false;
    updateTimeState();
    activeModal($modalNewGame);
    if ($btnCloseModal) $btnCloseModal.style.display = "none";
    if ($btnReturnGame) $btnReturnGame.style.display = "none";
  }

  // Funciones para manejar el tiempo
  // Convierte un string de tiempo en segundos
  // Formato esperado: "mm:ss" o "hh:mm:ss"
  function timeStringToSeconds(timeString) {
    const parts = timeString.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  // Actualiza el tiempo mostrado en el display
  // totalSeconds: segundos totales a mostrar
  // Formato: "hh:mm:ss" o "mm:ss"
  // Si hay horas, muestra "hh:mm:ss", si no, muestra "mm:ss
  function updateDisplayTime(totalSeconds) {
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let formattedTime =
      hours > 0
        ? `${String(hours).padStart(2, "0")} : ${String(minutes).padStart(
            2,
            "0"
          )} : ${String(seconds).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(
            2,
            "0"
          )}`;
    $displayTime.textContent = formattedTime;
  }

  // Actualiza el estado de los botones de tiempo
  // Si timerState es false, muestra el boton de play y oculta el de pause
  function updateTimeState() {
    if (timerState === false) {
      $btnPause.classList.add("hide");
      $btnPlay.classList.remove("hide");
      $textTime.textContent = "REANUDAR";
    } else {
      $btnPlay.classList.add("hide");
      $btnPause.classList.remove("hide");
      $textTime.textContent = "PAUSAR";
    }
  }

  updateTimeState();

  // Eventos para agregar numeros a las celdas
  // Usa $addNumber para agregar numeros a las celdas
  $addNumber(
    () => selectedCell,
    () => matrixCopy,
    (row, col, number, cell) => {
      let isValid =
        number !== "" && Number(number) === Number(matrixOriginal[row][col]);
      if (isValid) {
        cell.textContent = number;
        cell.dataset.numberValidation = "true";
        cell.classList.remove("invalid-cell");
        cell.setAttribute("data-locked", "true"); // Bloquea la celda
        matrixCopy[row][col] = number;
        updateScoreOnCorrect();
        if (isSudokuCompleteAndValid(matrixCopy)) {
          deleteGame();
          showFinishModal();
        }
      } else if (number !== "") {
        cell.textContent = number;
        cell.classList.add("invalid-cell");
        cell.removeAttribute("data-number-validation");
        cell.removeAttribute("data-locked");
        matrixCopy[row][col] = "";
        errorCounter++;
        if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
        updateScoreOnError();
        if (errorCounter >= maxErrors) {
          showErrorModal();
        }
      }
      reselectCell();
      updateNumberButtons();
    }
  );

  // Permite agregar numeros a las celdas usando el teclado
  // Usa $addNumberKeyboard para agregar numeros a las celdas
  // Permite agregar numeros a las celdas usando el teclado
  $addNumberKeyboard(
    () => selectedCell,
    () => matrixCopy,
    (row, col, number, cell) => {
      let isValid =
        number !== "" && Number(number) === Number(matrixOriginal[row][col]);
      if (isValid) {
        cell.textContent = number;
        cell.dataset.numberValidation = "true";
        cell.classList.remove("invalid-cell");
        cell.setAttribute("data-locked", "true");
        matrixCopy[row][col] = number;
        updateScoreOnCorrect();
        if (isSudokuCompleteAndValid(matrixCopy)) {
          deleteGame();
          showFinishModal();
        }
      } else if (number !== "") {
        cell.textContent = number;
        cell.classList.add("invalid-cell");
        cell.removeAttribute("data-number-validation");
        cell.removeAttribute("data-locked");
        matrixCopy[row][col] = "";
        errorCounter++;
        if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
        updateScoreOnError();
        if (errorCounter >= maxErrors) {
          showErrorModal();
        }
      }
      reselectCell();
      updateNumberButtons();
    }
  );

  // boton de pausa
  // Pausa el juego y oculta el tablero y la seleccion
  $btnPause.addEventListener("click", () => {
    timerState = false;
    if (timer) timer.pause();
    interactionEnabled = false;
    hideBoard();
    clearSelection();
    updateTimeState();
  });

  // boton de play
  // Reanuda el juego si estaba pausado
  $btnPlay.addEventListener("click", () => {
    timerState = true;
    if (timer) timer.start();
    interactionEnabled = true;
    showBoard();
    updateTimeState();
  });

  // Evento para manejar la visibilidad del documento
  // Si el documento se oculta, pausa el timer y oculta el tablero
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      timerState = false;
      if (timer) timer.pause();
      interactionEnabled = false;
      hideBoard();
      clearSelection();
      updateTimeState();
    }
  });

  const $btnDelete = $id("btn-delete");
  $btnDelete.addEventListener("click", () => {
    if (!interactionEnabled) return;
    const cell = selectedCell;
    if (!cell) return;
    // NO permite borrar si la celda esta bloqueada (original o valida)
    if (cell.getAttribute("data-locked") === "true") return;
    // Solo permite borrar si la celda es invalida (tiene la clase invalid-cell)
    if (!cell.classList.contains("invalid-cell")) return;
    const r = parseInt(cell.dataset.row) - 1;
    const c = parseInt(cell.dataset.col) - 1;
    cell.textContent = "";
    cell.classList.remove("invalid-cell");
    cell.removeAttribute("data-number-validation");
    cell.removeAttribute("data-locked");
    matrixCopy[r][c] = "";
    updateNumberButtons();
  });

  // Guardado periodico
  setInterval(() => {
    const currentPoints = $points.textContent;
    const currentTime = $displayTime.textContent;
    saveGame(
      matrixCopy,
      matrixOriginal,
      currentDifficulty,
      currentTime,
      currentPoints,
      errorCounter
    );
  }, 1000);

  function startNewGame(difficulty) {
    currentDifficulty = difficulty;
    matrix = createSudokuMatrix();
    fillMatrix(matrix, numbers, "");
    matrixOriginal = copyMatrix(matrix);
    matrixCopy = copyMatrix(matrix);
    hideNumbers(matrixCopy, "", difficulty, "");
    errorCounter = 0;
    if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
    $points.textContent = getInitialScore();
    createAndSelectBoard(matrixCopy);
    clearSelection();
    selectedCell = null;
    if (timer) timer.pause();
    timer = startTimer($displayTime, 0);
    timerState = true;
    timer.start();
    interactionEnabled = true;
    showBoard();
    updateTimeState();
    $difficultyDisplay.textContent = difficulty;
  }

  $btnNewGameTrigger.addEventListener("click", () => {
    resetNewGameModal();

    if ($modalFinishGame.style.display !== "flex") {
      if ($btnReturnGame) $btnReturnGame.style.display = "";
      if ($btnCloseModal) $btnCloseModal.style.display = "";
    }
    interactionEnabled = true;
    showBoard();
    updateTimeState();
    activeModal($modalNewGame);
  });

  $btnNewGameWelcome.addEventListener("click", () => {
    deleteGame();
    disableModal($modalWelcome);
    resetNewGameModal();
    if ($modalFinishGame.style.display !== "flex") {
      if ($btnReturnGame) $btnReturnGame.style.display = "";
      if ($btnCloseModal) $btnCloseModal.style.display = "";
    }
    activeModal($modalNewGame);
  });

  $btnNewGameFinish.addEventListener("click", () => {
    $modalFinishGame.style.display = "none";
    resetNewGameModal();

    activeModal($modalNewGame);
  });

  $btnCloseModal.addEventListener("click", () => {
    disableModal($modalNewGame);
    if ($btnReturnGame) $btnReturnGame.style.display = "";
    if ($btnCloseModal) $btnCloseModal.style.display = "";
  });
  $btnReturnGame.addEventListener("click", () => {
    disableModal($modalNewGame);
    if ($btnReturnGame) $btnReturnGame.style.display = "";
    if ($btnCloseModal) $btnCloseModal.style.display = "";
  });

  $difficultyOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const diff = btn.dataset.difficulty;
      resetNewGameModal();
      startNewGame(diff);
      disableModal($modalNewGame);
    });
  });

  $btnRestart.addEventListener("click", () => {
    resetNewGameModal();
    startNewGame(currentDifficulty);
    disableModal($modalNewGame);
  });

  $btnContinueGame.addEventListener("click", () => {
    timerState = true;
    if (timer) timer.start();
    interactionEnabled = true;
    showBoard();
    updateTimeState();
    disableModal($modalWelcome);
    if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
    updateNumberButtons();
  });

  $btnErrorRestart.addEventListener("click", () => {
    errorCounter = 0;
    if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
    startNewGame(currentDifficulty);
    $modalError.style.display = "none";
  });

  function reselectCell() {
    if (selectedCell) marcarSeleccionYCoincidencias(selectedCell);
  }

  function marcarSeleccionYCoincidencias(cell) {
    if (!cell) return;
    // Limpiar seleccion anterior
    clearSelection();

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = cell.textContent;

    // Marcar fila y columna
    document
      .querySelectorAll(`.game-left .col[data-row="${row}"]`)
      .forEach((c) => c.classList.add("selected-line"));
    document
      .querySelectorAll(`.game-left .col[data-col="${col}"]`)
      .forEach((c) => c.classList.add("selected-line"));

    // Marcar submatriz 3x3
    const boxRow = Math.floor((row - 1) / 3) * 3 + 1;
    const boxCol = Math.floor((col - 1) / 3) * 3 + 1;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        const boxCell = document.querySelector(
          `.game-left .col[data-row="${i}"][data-col="${j}"]`
        );
        if (boxCell) boxCell.classList.add("selected-line");
      }
    }

    // Marcar celda seleccionada
    cell.classList.add("selected-cell");

    // Marcar coincidencias (si hay valor)
    if (value && value !== "") {
      document.querySelectorAll(`.game-left .col`).forEach((c) => {
        if (c.textContent === value) c.classList.add("matching-cells");
      });
    }
  }

  // Funcion para actualizar el estado de los botones de numeros
  function updateNumberButtons() {
    const $numberButtons = document.querySelectorAll(".numbers .col");
    const counts = Array(10).fill(0);
    document.querySelectorAll(".sudoku-board .col").forEach((cell) => {
      const val = parseInt(cell.textContent);
      // Solo cuenta si la celda esta bloqueada (es valida)
      if (val >= 1 && val <= 9 && cell.getAttribute("data-locked") === "true") {
        counts[val]++;
      }
    });
    // Deshabilitar los botones que ya tienen 9 validos en el tablero
    $numberButtons.forEach((btn) => {
      const num = parseInt(btn.textContent);
      btn.disabled = counts[num] >= 9;
    });
  }

  updateNumberButtons();
});
