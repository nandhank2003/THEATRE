import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js"; // Assuming you have a User model

const configurePassport = () => {
  // Determine the callback URL based on the environment
  const callbackURL =
    process.env.NODE_ENV === "production"
      ? "https://malabarcinehub.onrender.com/auth/google/callback"
      : "http://localhost:5000/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find if a user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // If user exists, return them
            return done(null, user);
          } else {
            // If not, create a new user
            const newUser = new User({
              googleId: profile.id,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              email: profile.emails[0].value,
              // You might want to set a default role or other properties here
            });
            await newUser.save();
            return done(null, newUser);
          }
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // Serialize user to store in the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });
};

export default configurePassport;