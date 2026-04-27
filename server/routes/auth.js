import express from 'express';
import passport from 'passport';

const router = express.Router();

// The button on your frontend will link here
router.get('/steam', passport.authenticate('steam'));

// Steam redirects the user back here
router.get('/steam/return', 
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    // Send the steamId back to the frontend via a URL parameter
    const steamId = req.user.id;
    res.redirect(`http://localhost:5173?steamId=${steamId}`);
  }
);

export default router;