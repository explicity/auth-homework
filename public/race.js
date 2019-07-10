import { User, currentUser } from "./user.js";
import { startGame } from "./gameLogic.js";
import { proxiedNetworkFetch } from "./proxy.js";

let socket = io.connect();
const jwt = localStorage.getItem("jwt");

const raceWrapper = document.getElementById("race-wrapper");
const bubble = document.getElementById("bubble-inner");

window.onload = () => {
  if (!jwt) {
    location.replace("/login");
  } else {
    proxiedNetworkFetch(jwt);
    socket.emit("newUser", { token: jwt });
  }
};

socket.on("waitingMessage", () => {
  raceWrapper.innerHTML = "Please wait for others to finish the race!";
});

socket.on("updateCommentator", payload => {
  const { text } = payload;
  bubble.innerHTML = text;
});

socket.on("displayUsers", payload => {
  const { users } = payload;

  _.map(users, user => {
    const { id, name } = user;

    if (!ifUserExists(id)) {
      // display user using factory design pattern
      const racer = User(id, name);
      racer.display();
    }
  });
});

socket.on("displayCurrentUser", payload => {
  const { id, name } = payload;
  // modify user with some styles using factory design pattern
  const racer = _.assign(User(id, name), currentUser);

  if (!ifUserExists(id)) {
    racer.display();
  }
  // display modifications of current user
  racer.displayCurrent();
});

const ifUserExists = id => {
  const element = document.getElementById("user-" + id);
  return element;
};

socket.on("disconnectUser", payload => {
  const { users, key } = payload;

  if (users[key]) {
    const { id, name } = users[key];
    // delete user using factory design pattern
    const racer = User(id, name);
    racer.delete();
  }
});

socket.on("timer", timestamp => {
  const { countdown } = timestamp;

  raceWrapper.innerHTML =
    "Your race will start in " + timestamp.countdown + " seconds";
  if (countdown === 0) {
    socket.emit("joinRoom", { token: jwt });
    // fetching data from server by using proxy
    const api = proxiedNetworkFetch(jwt);
    startGame(api[0]);
  }
});

socket.on("updateProgressBars", payload => {
  const { users, key, progress, maxProgress } = payload;

  const { id } = users[key];

  const progressBar = document.getElementById("progress-" + id);
  progressBar.style.width = `${(progress * 100) / maxProgress}%`;
});

socket.on("winner", payload => {
  const { winners } = payload;

  const clear = new ClearLayout();
  clear.clearWrapper();

  _.forEach(winners, (winner, index) => {
    let p = document.createElement("p");
    p.innerHTML = `${index + 1}. ${winner.name}`;
    raceWrapper.appendChild(p);
  });

  clear.clearProgressBars();
});

class ClearLayout {
  clearWrapper() {
    while (raceWrapper.firstChild) {
      raceWrapper.removeChild(raceWrapper.firstChild);
    }
  }

  clearProgressBars() {
    const bars = document.querySelectorAll(".progress-bar");
    bars.forEach(bar => (bar.style.width = "0%"));
  }
}

export { socket };
