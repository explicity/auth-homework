const map = require("lodash/map");

// facade design pattern
class Commentator {
  constructor(socket) {
    this.socket = socket;
    this.broadcast = new BroadcasHelper(socket);
  }

  joke() {
    const joke = new CommentatorJokes().getJoke();
    this.broadcast.shareMessage(joke);
  }

  initialize() {
    const greeting = new Messages().getGreeting();

    this.socket.emit("updateCommentator", { text: greeting });
  }

  introduceUsers(users) {
    let message = new Messages().getListOfRacers();
    const names = new Racers(users).getNames();

    map(names, (name, index) => {
      const car = new Racers().getCar();

      message += `${name} on his ${car}`;
      if (index !== names.length - 1) {
        message += ", ";
      }
    });

    this.broadcast.shareMessage(message);
  }

  warning(name) {
    const warning = new Messages().getWarning(name);

    this.broadcast.shareMessage(warning);
  }

  winner(name) {
    clearInterval(this.timer);
    const message = new Messages().getWinner(name);

    this.broadcast.shareMessage(message);
  }

  getDetails(users, counter) {
    const sortedUsers = sortUsers(users);
    const sortedNames = new Racers(sortedUsers).getNames();
    let distance = null;

    if (sortedNames.length > 1) {
      const firstRacer = sortedUsers[0];
      const secondRacer = sortedUsers[1];
      distance = firstRacer[1] - secondRacer[1];
    }

    const message = new Messages().getDetails(counter, sortedNames, distance);
    this.broadcast.shareMessage(message);
  }

  endGame(winners) {
    let message = new Messages().getFinal();

    map(winners, (winner, index) => {
      const { name, counter } = winner;
      if (index < 3) {
        message += `${name} (${counter}s)`;

        index !== winners.length - 1 ? (message += ", ") : (message += ". ");
      }
    });
    message += "Thanks all for following us! See ya!";

    this.broadcast.shareMessage(message);
  }
}

const sortUsers = users => {
  let results = [];

  map(users, user => {
    const { name, progress } = user;
    results.push([name, progress]);
  });

  results.sort((a, b) => {
    return b[1] - a[1];
  });

  return results;
};

class BroadcasHelper {
  constructor(socket) {
    this.socket = socket;
  }

  shareMessage(message) {
    this.socket.broadcast.emit("updateCommentator", { text: message });
    this.socket.emit("updateCommentator", { text: message });
  }
}

class Messages {
  getGreeting() {
    const text =
      "Well hello there and welcome to the racing game with lots of bugs!";
    return text;
  }

  getListOfRacers() {
    const text = "So here we have a list of racers: ";
    return text;
  }

  getWarning(name) {
    const text = `Looks like ${name} is close to finish the race!`;
    return text;
  }

  getWinner(name) {
    const text = `And ${name} finishes the race!`;
    return text;
  }

  getDetails(counter, sortedNames, distance) {
    let text = `And it's ${counter}s second of the race! The leader is ${
      sortedNames[0]
    }! Good job! `;

    if (sortedNames.length > 1) {
      map(sortedNames, (user, index) => {
        switch (index) {
          case 0:
            break;
          case 1:
            text += `Right after him is ${user}. `;
            break;
          default:
            text += `Then it's ${user}. `;
        }
      });

      text += `And the distance between leaders are ${distance}! Keep the race on!`;
    }

    return text;
  }

  getFinal() {
    const text =
      "End of the game! And here are our finalists (from first to last place): ";
    return text;
  }
}

class Racers {
  constructor(users) {
    this.users = users;
  }

  getNames() {
    const results = [];

    map(this.users, user => {
      user.name ? results.push(user.name) : results.push(user[0]);
    });

    return results;
  }

  getCar() {
    const api = racingApi.getItems();
    return api[1];
  }
}

class CommentatorJokes {
  getJoke() {
    const api = racingApi.getItems();
    return api[0];
  }
}

const racingApi = {
  jokes: [
    "There must be funny joke, you know...",
    "No funny jokes today dude, just racing",
    "Did you come here to read a funny joke? Gonna dissapoint you"
  ],
  cars: ["Audi", "Ferrarri", "BMW"],

  getItems: function() {
    const items = map(this, item => {
      const random = Math.floor(Math.random() * 3);
      return item[random];
    });

    return items;
  }
};

module.exports = Commentator;
