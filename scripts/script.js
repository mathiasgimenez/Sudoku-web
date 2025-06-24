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
} from "./library.js";
import themeMode from "./theme-mode.js";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $id = (selector) => document.getElementById(selector);

  themeMode();

  let matrix,
    matrixCopy,
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
    $createBoard(matrixCopy, $board);
    $selectCell(
      (cell) => {
        selectedCell = cell;
        marcarSeleccionYCoincidencias(cell); 
      },
      () => interactionEnabled
    );
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
    fillMatrix(matrix, numbers, 0);
    matrixCopy = copyMatrix(matrix);
    hideNumbers(matrixCopy, "", currentDifficulty, 0);
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

  function timeStringToSeconds(timeString) {
    const parts = timeString.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

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

  $addNumber(
    () => selectedCell,
    () => matrixCopy,
    (row, col, number, isValid) => {
      if (isValid) {
        updateScoreOnCorrect();
        if (isSudokuCompleteAndValid(matrixCopy)) {
          deleteGame();
          showFinishModal();
        }
      } else {
        errorCounter++;
        if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
        updateScoreOnError();
        if (errorCounter >= maxErrors) {
          showErrorModal();
        }
      }
      reselectCell();
    }
  );

  $addNumberKeyboard(
    () => selectedCell,
    () => matrixCopy,
    (row, col, number, isValid) => {
      if (isValid) {
        updateScoreOnCorrect();
        if (isSudokuCompleteAndValid(matrixCopy)) {
          deleteGame();
          showFinishModal();
        }
      } else {
        errorCounter++;
        if ($errors) $errors.textContent = `${errorCounter}/${maxErrors}`;
        updateScoreOnError();
        if (errorCounter >= maxErrors) {
          showErrorModal();
        }
      }
      reselectCell();
    }
  );

  $btnPause.addEventListener("click", () => {
    timerState = false;
    if (timer) timer.pause();
    interactionEnabled = false;
    hideBoard();
    clearSelection();
    updateTimeState();
  });

  $btnPlay.addEventListener("click", () => {
    timerState = true;
    if (timer) timer.start();
    interactionEnabled = true;
    showBoard();
    updateTimeState();
  });

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
    if (cell.classList.contains("invalid-cell")) {
      const r = parseInt(cell.dataset.row) - 1;
      const c = parseInt(cell.dataset.col) - 1;
      cell.textContent = "";
      cell.classList.remove("invalid-cell");
      matrixCopy[r][c] = "";
    }
  });

  setInterval(() => {
    const currentPoints = $points.textContent;
    const currentTime = $displayTime.textContent;
    saveGame(
      matrixCopy,
      currentDifficulty,
      currentTime,
      currentPoints,
      errorCounter
    );
  }, 1000);

  function startNewGame(difficulty) {
    currentDifficulty = difficulty;
    matrix = createSudokuMatrix();
    fillMatrix(matrix, numbers, 0);
    matrixCopy = copyMatrix(matrix);
    hideNumbers(matrixCopy, "", difficulty, 0);
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
});
