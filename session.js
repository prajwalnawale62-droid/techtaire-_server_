const express = require('express');
const router = express.Router();
const { createSession, getSessionStatus, destroySession, getAllSessions } = require('../whatsapp');
const { authenticateToken, registerUser, loginUser } = require('../auth');

// Register user
router.post('/register', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  const result = registerUser(userId, password);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Login
router.post('/login', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  const result = loginUser(userId, password);
  if (result.error) return res.status(401).json(result);
  res.json(result);
});

// WhatsApp session start karo (QR generate hoga)
router.post('/connect', authenticateToken, async (req, res) => {
  const io = req.app.get('io');
  try {
    const result = await createSession(req.userId, io);
    res.json({ message: 'Session starting, listen for QR on socket', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session status check
router.get('/status', authenticateToken, (req, res) => {
  const status = getSessionStatus(req.userId);
  res.json(status);
});

// Session disconnect
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const result = await destroySession(req.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: all sessions (extra security layer lagao production me)
router.get('/all', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(getAllSessions());
});

module.exports = router;
