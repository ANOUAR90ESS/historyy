import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

export const hash = value => createHash('sha256').update(value).digest('hex');
const randomToken = () => randomBytes(32).toString('base64url');
const cookieOptions = req => ({ httpOnly: true, secure: req.secure, sameSite: 'lax', path: '/' });

export function registerAuth(app, db, config) {
  const configured = Boolean(config.googleClientId && config.googleClientSecret);
  const client = new OAuth2Client(config.googleClientId, config.googleClientSecret, `${config.appUrl}/api/auth/google/callback`);

  app.use((req, res, next) => {
    const token = req.cookies.forma_session;
    req.user = typeof token === 'string' ? db.prepare(`SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id
      WHERE token_hash=? AND expires_at>?`).get(hash(token), Date.now()) : undefined;
    next();
  });

  app.get('/api/auth/google', async (req, res) => {
    if (!configured) return res.redirect('/?authError=not_configured');
    const state = randomToken();
    const nonce = randomToken();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    db.prepare('DELETE FROM oauth_states WHERE expires_at<?').run(Date.now());
    db.prepare('INSERT INTO oauth_states VALUES (?,?,?,?)').run(hash(state), codeVerifier, nonce, Date.now() + 600000);
    res.cookie('forma_oauth', state, { ...cookieOptions(req), maxAge: 600000 });
    res.redirect(client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'], state, nonce, code_challenge: codeChallenge,
      code_challenge_method: 'S256', prompt: 'select_account',
    }));
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { state, code } = req.query;
    res.clearCookie('forma_oauth', cookieOptions(req));
    if (!configured || typeof state !== 'string' || typeof code !== 'string' || state !== req.cookies.forma_oauth) {
      return res.redirect('/?authError=invalid_state');
    }
    const record = db.prepare('DELETE FROM oauth_states WHERE state_hash=? RETURNING *').get(hash(state));
    if (!record || record.expires_at < Date.now()) return res.redirect('/?authError=expired');
    try {
      const { tokens } = await client.getToken({ code, codeVerifier: record.verifier });
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.googleClientId });
      const payload = ticket.getPayload();
      if (!payload?.email_verified || payload.nonce !== record.nonce || !payload.sub || !payload.email) throw new Error('Invalid identity');
      let user = db.prepare('SELECT * FROM users WHERE google_id=?').get(payload.sub);
      if (!user) {
        const id = randomUUID();
        db.prepare('INSERT INTO users (id,google_id,name,email) VALUES (?,?,?,?)').run(id, payload.sub, payload.name || payload.email, payload.email);
        user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
      }
      if (req.cookies.forma_session) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(req.cookies.forma_session));
      db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
      const token = randomToken();
      const maxAge = 7 * 24 * 3600 * 1000;
      db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), user.id, Date.now() + maxAge);
      res.cookie('forma_session', token, { ...cookieOptions(req), maxAge });
      res.redirect('/');
    } catch { res.redirect('/?authError=failed'); }
  });

  app.get('/api/session', (req, res) => res.json({
    user: req.user ? { id: req.user.id, name: req.user.name, email: req.user.email, credits: req.user.credits } : null,
    googleConfigured: configured, replicateConfigured: Boolean(config.replicateToken),
    costs: { image: 1, video: 10 }, welcomeCredits: 100,
  }));
  app.post('/api/auth/logout', (req, res) => {
    if (req.cookies.forma_session) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(req.cookies.forma_session));
    res.clearCookie('forma_session', cookieOptions(req));
    res.json({ ok: true });
  });
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Inicia sesión para acceder a tu espacio.' });
  next();
}
