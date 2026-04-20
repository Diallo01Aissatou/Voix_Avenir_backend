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
    const backendUrl = process.env.BACKEND_URL || "https://voix-avenir-backend.onrender.com";
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
        callbackURL: `${backendUrl}/api/auth/google/callback`,
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
  const backendUrl = process.env.BACKEND_URL || "https://voix-avenir-backend.onrender.com";
  const tiktokStrategy = new TikTokStrategy({
      clientID: process.env.TIKTOK_CLIENT_KEY.trim(),
      clientSecret: process.env.TIKTOK_CLIENT_SECRET.trim(),
      callbackURL: `${backendUrl}/api/auth/tiktok/callback`,
      scope: ['user.info.basic'],
      scopeSeparator: ' ',
      proxy: true,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('TikTok Profile received:', profile.id);
        let user = await User.findOne({ tiktokId: profile.id });
        if (!user) {
          const email = profile.email || `${profile.id}@tiktok.com`;
          user = await User.findOne({ email });
          if (user) {
            user.tiktokId = profile.id;
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
                console.error('Erreur parsing state OAuth TikTok:', e);
              }
            }

            user = await User.create({
              name: profile.displayName || profile.username || 'TikTok User',
              email: email,
              tiktokId: profile.id,
              role: role,
              verified: true,
              photo: profile.photo || null
            });
          }
        }
        return done(null, user);
      } catch (err) {
        console.error('Error in TikTok strategy callback:', err);
        return done(err, null);
      }
    }
  );

  // Override userProfile to use V2 API manually if needed or to debug
  tiktokStrategy.userProfile = function(accessToken, authData, done) {
    const url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url';
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(res => res.json())
    .then(json => {
      console.log('TikTok V2 API Response:', JSON.stringify(json));
      if (json.error && json.error.code !== 'ok') {
        return done(new Error(`TikTok API error: ${json.error.message} (${json.error.code})`));
      }
      
      if (!json.data || !json.data.user) {
        return done(new Error('TikTok API returned no user data'));
      }

      const user = json.data.user;
      const profile = {
        provider: 'tiktok',
        id: user.open_id,
        displayName: user.display_name,
        username: user.open_id,
        photo: user.avatar_url,
        _raw: JSON.stringify(json),
        _json: json
      };
      done(null, profile);
    })
    .catch(err => {
      console.error('TikTok Profile Fetch Exception:', err);
      done(err);
    });
  };

  passport.use(tiktokStrategy);
}

// Stratégie LinkedIn
if (process.env.LINKEDIN_KEY && process.env.LINKEDIN_SECRET) {
  const backendUrl = process.env.BACKEND_URL || "https://voix-avenir-backend.onrender.com";
  const linkedinStrategy = new LinkedInStrategy({
      clientID: process.env.LINKEDIN_KEY,
      clientSecret: process.env.LINKEDIN_SECRET,
      callbackURL: `${backendUrl}/api/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email'],
      proxy: true,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ linkedinId: profile.id });
        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
          }
          
          if (user) {
            user.linkedinId = profile.id;
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
                console.error('Erreur parsing state OAuth LinkedIn:', e);
              }
            }

            user = await User.create({
              name: profile.displayName,
              email: email || `${profile.id}@linkedin.com`,
              linkedinId: profile.id,
              role: role,
              verified: true,
              photo: profile.photos?.[0]?.value || null
            });
          }
        }
        return done(null, user);
      } catch (err) {
        console.error('Error in LinkedIn strategy callback:', err);
        return done(err, null);
      }
    }
  );

  // Override userProfile pour utiliser l'endpoint OpenID Connect
  linkedinStrategy.userProfile = function(accessToken, done) {
    const url = 'https://api.linkedin.com/v2/userinfo';
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(res => res.json())
    .then(json => {
      console.log('LinkedIn UserInfo Response:', JSON.stringify(json));
      if (json.error || json.errorCode) {
        return done(new Error(`LinkedIn API error: ${json.message || json.error}`));
      }

      const profile = {
        provider: 'linkedin',
        id: json.sub,
        displayName: json.name || `${json.given_name || ''} ${json.family_name || ''}`.trim(),
        emails: json.email ? [{ value: json.email }] : [],
        photos: json.picture ? [{ value: json.picture }] : [],
        _raw: JSON.stringify(json),
        _json: json
      };
      done(null, profile);
    })
    .catch(err => {
      console.error('LinkedIn Profile Fetch Error:', err);
      done(err);
    });
  };

  passport.use(linkedinStrategy);
} else {
  console.warn('LINKEDIN_KEY ou LINKEDIN_SECRET manquants. LinkedIn OAuth ne sera pas activé.');
}

module.exports = passport;
