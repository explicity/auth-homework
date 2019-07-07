const express = require("express");
const path = require("path");
const router = express.Router();

const passport = require("passport");
const jwt = require("jsonwebtoken");

router.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "../login.html"));
});

router.post("/", function(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: "Something is not right",
        user: user
      });
    }

    req.login(user, { session: false }, err => {
      if (err) {
        res.send(err);
      }

      const token = jwt.sign(user, "your_jwt_secret");
      return res.json({ user, token, auth: true });
    });
  })(req, res);
});

module.exports = router;
