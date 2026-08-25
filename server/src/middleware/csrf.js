import crypto from 'node:crypto';

export const CSRF_COOKIE = 'agrismart_csrf';

/**
 * Double-submit CSRF protection.
 * - Sets a random token in a readable cookie when absent.
 * - Mutating requests (POST/PUT/PATCH/DELETE) must echo it back
 *   in the X-CSRF-Token header.
 * Safe even for cross-origin requests because the attacker cannot
 * read the cookie value (CORS blocks it).
 */
export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  const cookieToken = req.cookies?.[CSRF_COOKIE];

  let token = cookieToken;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const header = req.headers['x-csrf-token'] || req.body?.csrf_token || '';
    if (!token || !header || !crypto.timingSafeEqual(Buffer.from(String(token)), Buffer.from(String(header)))) {
      return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
    }
  }

  next();
}