const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "../index.html"));
});

router.get("/login", function(req, res) {
  res.sendFile(path.join(__dirname, "../login.html"));
});

router.get("/race", function(req, res, next) {
  res.sendFile(path.join(__dirname, "../race.html"));
});


module.exports = router;
