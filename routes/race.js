const express = require("express");
const path = require("path");
const router = express.Router();
const passport = require("passport");

const text = require("../text.json");

router.get("/", function(req, res, next) {
  return res.sendFile(path.join(__dirname, "../race.html"));
});

router.get("/api", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  res.json({ text: text[0] });
});

module.exports = router;
