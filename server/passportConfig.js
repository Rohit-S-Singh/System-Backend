const User = require("../server/models/user");
const bcrypt = require("bcrypt");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;


module.exports = function (passport) {
  passport.use(
    new LocalStrategy({usernameField: 'email'} ,function (email, password, done) {
      User.findOne({ email : email },  async (err, user)=> {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }

        console.log(password,user.password,"ewfwefewfew");
        await bcrypt.compare(password, user.password, (err, result) => {
            console.log(result);
          if (err) throw err;

          if (result === true) {
            return done(null, user);
          } else{console.log("abcd");return done(null, false)};
        });
      });
    })
  );
};

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findOne({ _id: id }, (err, user) => {
    cb(err, user);
  });
});
