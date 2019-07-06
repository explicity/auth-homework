const passport = require("passport");
const passportJWT = require("passport-jwt");

const LocalStrategy = require("passport-local").Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const users = require("./users.json");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    (email, password, done) => {
      const user = users.find(userFromList => {
        if (
          userFromList.email === email &&
          userFromList.password === password
        ) {
          return userFromList;
        }
      });

      if (!user) {
        return done(null, false, {
          message: "Incorrect email or password."
        });
      }
      return done(null, user, { message: "Logged In Successfully" });
    }
  )
);

const opts = {
  secretOrKey: "your_jwt_secret",
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
};

passport.use(
  new JWTStrategy(opts, async (payload, done) => {
    try {
      const user = users.find(userFromDB => {
        if (userFromDB.login === payload.login) {
          return userFromDB;
        }
      });
      return user
        ? done(null, user)
        : done({ status: 401, message: "Token is invalid." }, null);
    } catch (err) {
      return done(err);
    }
  })
);
