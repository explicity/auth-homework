const path = require("path");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const passport = require("passport");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const size = require("lodash/size");
const has = require("lodash/has");
const map = require("lodash/map");

const index = require("./routes/index");
const auth = require("./routes/auth");
const race = require("./routes/race");

const Commentator = require("./commentator");

require("./passport.config");

server.listen(3000);

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/", index);
app.use("/login", auth);
app.use("/race", race);

let users = {},
  isRaceOn = false,
  isCountdownOn = false,
  winners = [],
  counter = 0;

io.on("connection", socket => {
  //creating a commentator with facade design pattern
  const commentator = new Commentator(socket);
  commentator.initialize();

  if (io.engine.clientsCount === 1) {
    isRaceOn = false;
  }

  if (!isRaceOn) {
    socket.join("play");

    if (io.engine.clientsCount === 1 && !isCountdownOn) {
      startTimer();
    }
  } else {
    socket.emit("waitingMessage");
  }

  socket.on("newUser", payload => {
    const { token } = payload;
    const verifyUser = jwt.verify(token, "your_jwt_secret");

    if (verifyUser) {
      const user = jwt.decode(token);
      const { name, id } = user;

      const playUsers = io.sockets.adapter.rooms["play"];

      if (playUsers) {
        if (has(playUsers.sockets, socket.id)) {
          users[socket.id] = { name, id, progress: 0 };
          io.sockets.emit("displayUsers", { users });
        }
      }
      socket.emit("displayCurrentUser", { id, name });
    }
  });

  socket.on("updateProgress", payload => {
    const { token, maxProgress } = payload;

    const verifyUser = jwt.verify(token, "your_jwt_secret");

    if (verifyUser) {
      const user = users[socket.id];
      const { name } = user;
      user.progress++;
      io.sockets.in("play").emit("updateProgressBars", {
        users,
        key: socket.id,
        progress: user.progress,
        maxProgress
      });
      socket.emit("updateProgressBars", {
        users,
        key: socket.id,
        progress: user.progress,
        maxProgress
      });

      if (maxProgress - user.progress === 6) {
        commentator.warning(name);
      }

      if (user.progress === maxProgress) {
        commentator.winner(name);
        socket.emit("waitingMessage");
        winners.push({ name, counter });

        if (winners.length === size(users)) {
          endGame(winners);
        }
      }
    }
  });

  socket.on("joinRoom", payload => {
    const { token } = payload;
    const verifyUser = jwt.verify(token, "your_jwt_secret");

    if (verifyUser) {
      const playUsers = io.sockets.adapter.rooms["play"];
      const user = jwt.decode(token);
      const { name, id } = user;

      if (playUsers) {
        if (!has(playUsers.sockets, socket.id)) {
          users[socket.id] = { name, id, progress: 0 };
          socket.join("play");
        }
      }

      io.sockets.emit("displayUsers", { users });
    }
  });

  socket.on("disconnect", function() {
    socket.leave("play");
    io.sockets.emit("disconnectUser", { users, key: socket.id });
    delete users[socket.id];

    if (!io.sockets.adapter.rooms["play"] || io.engine.clientsCount === 0) {
      isRaceOn = false;
    }
  });

  function startTimer() {
    let countdown = 15;
    isCountdownOn = true;

    const timer = setInterval(() => {
      countdown--;

      if (countdown < 0) {
        isRaceOn = true;
        isCountdownOn = false;

        gameTimer();  
        commentator.introduceUsers(users);
        clearInterval(timer);
        return;
      }
      io.sockets.emit("timer", { countdown });
    }, 1000); 
  }

  const gameTimer = () => {
    const timer = setInterval(() => {
      counter++;
      // display a joke every 11 seconds 
      if (counter % 11 === 0) {
        commentator.joke()
      }

      if (counter % 15 === 0) {
        commentator.getDetails(users, counter);
      }

      if (!isRaceOn) {
        counter = 0;
        clearInterval(timer);
      } 
    }, 1000);
  };

  function endGame() {
    io.sockets.in("play").emit("winner", { winners });
    socket.emit("winner", { winners });

    commentator.endGame(winners);
 
    isRaceOn = false;
    winners = [];
    io.sockets.emit("joinRoom");

    map(users, user => {
      user.progress = 0;
    });

    startTimer();
  }
});

module.exports = app;
