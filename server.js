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
app.use("/race", passport.authenticate('jwt', {session: false}), race);


module.exports = server;
