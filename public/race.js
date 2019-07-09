import { User, currentUser } from "./user.js";

let socket = io.connect();
const jwt = localStorage.getItem("jwt");

const raceWrapper = document.getElementById("race-wrapper");

window.onload = () => {
  if (!jwt) {
    location.replace("/login");
  } else {
    socket.emit("newUser", { token: jwt });
  }
};

socket.on("waitingMessage", () => {
  raceWrapper.innerHTML = "Please wait for others to finish the race!";
});

socket.on("displayUsers", payload => {
  const { users } = payload;

  for (const key in users) {
    const { id, name } = users[key];  

    if (!ifUserExists(id)) { 
      // display user using factory design pattern
      const racer = User(id, name); 
      racer.display();
    }
  }
});

socket.on("displayCurrentUser", payload => {
  const { id, name } = payload;
  // modify user with some styles using factory design pattern
  const racer = Object.assign(User(id, name), currentUser);

  if (!ifUserExists(id)) {
    racer.display();
  }

  // display modifications
  racer.displayCurrent();

});

const ifUserExists = id => {
  const element = document.getElementById("user-" + id);
  return element;
};

socket.on("disconnectUser", payload => {
  const { users, key } = payload;

  if (users[key]) {
    const userLi = document.getElementById("user-" + users[key].id);
    userLi.parentNode.removeChild(userLi);
  }
});

socket.on("timer", timestamp => {
  const { countdown } = timestamp;

  raceWrapper.innerHTML =
    "Your race will start in " + timestamp.countdown + " seconds";
  if (countdown === 0) {
    socket.emit("joinRoom", { token: jwt });

    fetch("/race/api", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      }
    })
      .then(res => {
        res.json().then(body => {
          startGame(body.text);
        });
      })
      .catch(err => console.log(err));
  }
});

socket.on("updateProgressBars", payload => {
  const { users, key, progress, maxProgress } = payload;

  const progressBar = document.getElementById("progress-" + users[key].id);
  progressBar.style.width = `${(progress * 100) / maxProgress}%`;
});

socket.on("winner", payload => {
  const { users } = payload;

  while (raceWrapper.firstChild) {
    raceWrapper.removeChild(raceWrapper.firstChild);
  }

  let winners = [];
  for (const key in users) {
    if (users[key].progress !== 0) {
      winners.push([users[key].name, users[key].progress]);
    }
  }

  winners.sort((a, b) => {
    return b[1] - a[1];
  });

  winners.forEach((winner, index) => {
    let p = document.createElement("p");
    p.innerHTML = `${index + 1}. ${winner[0]}`;
    raceWrapper.appendChild(p);
  });

  const bars = document.querySelectorAll(".progress-bar");
  bars.forEach(bar => (bar.style.width = "0%"));
});

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
