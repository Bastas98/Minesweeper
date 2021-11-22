import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import buttonImage from "./images/Button.png";
import BombImage from "./images/Bomb.png";
import FlaggedImage from "./images/ButtonFlagged.png";

const pickImage = (content) => {
  switch (content.type) {
    case "number":
      return null;
    case "bomb":
      return BombImage;
    case "button":
      return buttonImage;
    case "flagged":
      return FlaggedImage;
    default:
      return null;
  }
};

function Square({ content, onLeftClick, onRightClick }) {
  const onClick = useCallback(
    (e) => {
      if (e.type === "click") {
        onLeftClick();
      } else if (e.type === "contextmenu") {
        e.stopPropagation();
        e.preventDefault();
        onRightClick();
      }
    },
    [onLeftClick, onRightClick]
  );

  const squareImage = pickImage(content);
  const styles = squareImage
    ? { backgroundImage: `url(${squareImage})` }
    : undefined;

  return (
    <button
      className="square"
      style={styles}
      onClick={onClick}
      onContextMenu={onClick}
    >
      {content.type === "number" ? content.number : null}
    </button>
  );
}

function calculateAdjacent(board, boardSize, i, j) {
  const adjacentOffsets = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  let adjacentI, adjacentJ;
  let adjacentBombs = 0;

  adjacentOffsets.forEach(([x, y]) => {
    adjacentI = i + y;
    adjacentJ = j + x;

    if (
      adjacentI < boardSize &&
      adjacentI >= 0 &&
      adjacentJ < boardSize &&
      adjacentJ >= 0
    ) {
      if (board[adjacentI][adjacentJ] === "b") {
        adjacentBombs++;
      }
    }
  });

  return adjacentBombs === 0 ? null : adjacentBombs;
}

function buildBoard(boardSize, numBombs) {
  let numSetBombs = 0;
  let bombLocations = new Map();

  while (numSetBombs < numBombs) {
    let i = Math.floor(Math.random() * boardSize);
    let j = Math.floor(Math.random() * boardSize);
    let position = [i, j];
    if (!bombLocations.has(position)) {
      numSetBombs++;
      bombLocations.set(position, true);
    }
  }

  let tempBoard = Array.from({ length: boardSize }, () =>
    Array.from({ length: boardSize }, () => null)
  );
  for (let [i, j] of bombLocations.keys()) {
    tempBoard[i][j] = "b";
  }

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (tempBoard[i][j] !== "b") {
        tempBoard[i][j] = calculateAdjacent(tempBoard, boardSize, i, j);
      }
    }
  }

  return tempBoard;
}

function giveContent(board, isFlagged, isRevealed, i, j) {
  if (!isRevealed[i][j]) {
    if (isFlagged[i][j]) {
      return { type: "flagged" };
    } else {
      return { type: "button" };
    }
  } else {
    if (board[i][j] === "b") {
      return { type: "bomb" };
    } else {
      return { type: "number", number: board[i][j] };
    }
  }
}

function isWin(board, isFlagged) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      if (board[i][j] === "b" && isFlagged[i][j] === "false") {
        return false;
      }
    }
  }
  return true;
}

function isLoss(board, isRevealed) {
  console.log(board.isRevealed);
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      console.log(board[i][j] === "b");
      if (board[i][j] === "b" && isRevealed[i][j] === "true") {
        console.log(i, j);
        return true;
      }
    }
  }
  return false;
}

function Game({ boardSize, numBombs }) {
  const [board, setBoard] = useState(buildBoard(boardSize, numBombs));
  const [flagsLeft, setFlagsLeft] = useState(numBombs);

  const [isFlagged, setisFlagged] = useState(
    Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => false)
    )
  );
  const [isRevealed, setisRevealed] = useState(
    Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => false)
    )
  );

  useEffect(() => {
    if (flagsLeft === 0) {
      if (isWin(board, isFlagged)) {
        window.confirm(
          "Congratulations, you have Won! \nWould you like to Play Again?"
        );
      }
    }
  }, [flagsLeft]);

  const returnAdjacents = (i, j) => {
    let adjacentArray = [];
    const adjacentOffsets = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    let adjacentI, adjacentJ;

    adjacentOffsets.forEach(([x, y]) => {
      adjacentI = i + y;
      adjacentJ = j + x;

      if (
        adjacentI < boardSize &&
        adjacentI >= 0 &&
        adjacentJ < boardSize &&
        adjacentJ >= 0
      ) {
        adjacentArray.push({ i: adjacentI, j: adjacentJ });
      }
    });
    return adjacentArray;
  };

  const revealAdjacents = (i, j) => {
    const tempIsRevealed = isRevealed.map((row) => row.map((col) => col));
    let revealArray = returnAdjacents(i, j);
    let currentCell;

    while (revealArray.length > 0) {
      currentCell = revealArray.pop();
      if (tempIsRevealed[currentCell.i][currentCell.j] === false) {
        if (board[currentCell.i][currentCell.j] === null) {
          returnAdjacents(currentCell.i, currentCell.j).map((cell) =>
            revealArray.push(cell)
          );
          tempIsRevealed[currentCell.i][currentCell.j] = true;
        } else if (typeof board[currentCell.i][currentCell.j] === "number") {
          tempIsRevealed[currentCell.i][currentCell.j] = true;
        }
      }
    }
    setisRevealed(tempIsRevealed);
  };

  const callbackLeftClick = useCallback(
    (i, j) => {
      if (!isRevealed[i][j] && !isFlagged[i][j]) {
        const temp = isRevealed.map((row) => row.map((col) => col));
        temp[i][j] = true;
        setisRevealed(temp);

        if (board[i][j] === null) {
          revealAdjacents(i, j);
        } else if (board[i][j] === "b") {
          window.confirm(
            "Unlucky you clicked on a Bomb! \nWould you like to Play Again?"
          );
        }
      }
    },
    [isRevealed, isFlagged, board]
  );

  const callbackRightClick = useCallback(
    (i, j) => {
      if (!isRevealed[i][j] && !(!isFlagged[i][j] && flagsLeft === 0)) {
        const temp = isFlagged.map((row) => {
          return row.map((col) => col);
        });
        temp[i][j] = !temp[i][j];
        console.log(flagsLeft);
        setFlagsLeft(temp[i][j] ? flagsLeft - 1 : flagsLeft + 1);
        setisFlagged(temp);
      }
    },
    [isRevealed, isFlagged, flagsLeft]
  );

  return (
    <div className="container">
      <div className="game">
        <div className="game-board">
          {board.map((row, idx) => (
            <div className="board-row" key={idx}>
              {row.map((column, idy) => (
                <Square
                  key={idy}
                  content={giveContent(board, isFlagged, isRevealed, idx, idy)}
                  onLeftClick={() => callbackLeftClick(idx, idy)}
                  onRightClick={() => callbackRightClick(idx, idy)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(
  <div>
    <Game boardSize={9} numBombs={2} />
  </div>,
  document.getElementById("root")
);
