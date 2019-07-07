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

const index = require("./routes/index");
const auth = require("./routes/auth");
const race = require("./routes/race");

require("./passport.config");

server.listen(3001);

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/", index);
app.use("/login", auth);
app.use("/race", /*passport.authenticate("jwt", { session: false }),*/ race);

let users = {},
  isRaceOn = false,
  isCountdownOn = false;

io.on("connection", socket => {
  if (!isRaceOn) {
    socket.join("play");

    if (io.engine.clientsCount === 1 || !isCountdownOn) {
      let countdown = 10;
      isCountdownOn = true;

      setInterval(() => {
        countdown--;
        if (countdown < 0) {
          isRaceOn = true;
          isCountdownOn = false;
          return;
        }
        io.sockets.emit("timer", { countdown });
      }, 1000);
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
      users[socket.id] = { name, id, progress: -1 };
      console.log(users);

      io.sockets.emit("displayUsers", { users });
      socket.emit("displayCurrentUser", { id });
    }
  });

  socket.on("updateProgress", payload => {
    const { token, maxProgress } = payload;
    const verifyUser = jwt.verify(token, "your_jwt_secret");

    if (verifyUser) {
      const user = users[socket.id];
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

      if (user.progress === maxProgress) {
        io.sockets.in("play").emit("winner", { users, key: socket.id });
        socket.emit("winner", { users, key: socket.id });

        for (const key in users) {
          users[key].progress = -1;
        }

        let countdown = 10;

        setInterval(() => {
          setInterval(() => {
            countdown--;
            if (countdown < 0) {
              isRaceOn = true;
              isCountdownOn = false;
              return;
            }
            io.sockets.emit("timer", { countdown });
          }, 1000);
        }, 2000);
      }
    }
  });

  socket.on("joinRoom", () => {
    socket.join("play");
  });

  socket.on("disconnect", function() {
    socket.leave("play");
    io.sockets.emit("disconnectUser", { users, key: socket.id });
    delete users[socket.id];

    if (!io.sockets.adapter.rooms["play"] || io.engine.clientsCount === 0) {
      isRaceOn = false;
    }
  });
});

module.exports = app;
