import { socket } from "./race.js";

const jwt = localStorage.getItem("jwt");
const raceWrapper = document.getElementById("race-wrapper");

function startGame(map) {
  const text = map.text;

  raceWrapper.innerHTML = "";
  const textByLetter = text.split("");

  textByLetter.forEach((letter, index) => {
    let span = document.createElement("span");
    span.classList.add("span");
    if (index === 0) {
      span.classList.add("bg-next");
    }
    span.innerHTML = letter;
    raceWrapper.appendChild(span);
  });

  document.addEventListener("keydown", typing, false);
}

function typing(e) {
  const spans = document.querySelectorAll(".span");
  const maxProgress = spans.length;

  let typed = String.fromCharCode(e.which);

  for (let i = 0; i < spans.length; i++) {
    if (spans[i].innerHTML === typed) {
      if (spans[i].classList.contains("bg")) {
        continue;
      } else if (
        (spans[i].classList.contains("bg") === false &&
          spans[i - 1] === undefined) ||
        spans[i - 1].classList.contains("bg") !== false
      ) {
        spans[i].classList.add("bg");
        if (i !== spans.length - 1) {
          spans[i + 1].classList.add("bg-next");
        }
        socket.emit("updateProgress", { token: jwt, maxProgress });
        break;
      }
    }
  }
}

export { startGame };
