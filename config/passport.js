const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TikTokStrategy = require('passport-tiktok-auth').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Stratégie Google
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            // Mettre à jour la photo si disponible
            if (profile.photos && profile.photos[0]) {
              user.photo = profile.photos[0].value;
              await user.save();
            }
          } else {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.googleId = profile.id;
              // Toujours mettre à jour la photo depuis Google si disponible
              if (profile.photos && profile.photos[0]) {
                user.photo = profile.photos[0].value;
              }
              await user.save();
            } else {
              // Extraire le rôle du state OAuth
              let role = 'mentoree';
              if (req.query.state) {
                try {
                  const state = JSON.parse(req.query.state);
                  if (state.role && ['mentore', 'mentoree', 'admin'].includes(state.role)) {
                    role = state.role;
                  }
                } catch (e) {
                  console.error('Erreur parsing state OAuth:', e);
                }
              }
  
              user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                role: role,
                verified: true,
                photo: profile.photos[0]?.value
              });
            }
          }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}

// Stratégie TikTok
if (process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) {
  passport.use(new TikTokStrategy({
      clientID: process.env.TIKTOK_CLIENT_KEY.trim(),
      clientSecret: process.env.TIKTOK_CLIENT_SECRET.trim(),
      callbackURL: "/api/auth/tiktok/callback",
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ tiktokId: profile.id });
        if (!user) {
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.id}@tiktok.com`;
          user = await User.findOne({ email });
          if (user) {
            user.tiktokId = profile.id;
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName || profile.username || 'TikTok User',
              email: email,
              tiktokId: profile.id,
              role: 'mentoree',
              verified: true,
              photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}

// Stratégie LinkedIn
if (process.env.LINKEDIN_KEY && process.env.LINKEDIN_SECRET) {
  passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_KEY,
      clientSecret: process.env.LINKEDIN_SECRET,
      callbackURL: "/api/auth/linkedin/callback",
      scope: ['r_emailaddress', 'r_liteprofile'],
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ linkedinId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.linkedinId = profile.id;
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              linkedinId: profile.id,
              role: 'mentoree',
              verified: true,
              photo: profile.photos[0]?.value
            });
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}

module.exports = passport;
