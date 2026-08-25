import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';

export const ADMIN_ROLES = ['super_admin', 'farmer'];

export const TOKEN_COOKIE = 'agrismart_token';

export function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: env.JWT_EXPIRES_IN * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
}

/** Attach req.user from the JWT cookie. Does not reject when absent. */
export async function optionalAuth(req, _res, next) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const userId = Number(payload.sub);

      // Fetch current role from database to ensure it's up to date
      const { rows } = await pool.query(
        `SELECT u.id, u.username, COALESCE(m.role, 'user') AS role
         FROM users u
         LEFT JOIN user_accounts_meta m ON m.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      if (rows.length > 0) {
        // req.user = {
        //   id: rows[0].id,
        //   username: rows[0].username,
        //   role: rows[0].role,
        // };
        req.user = {
          id: Number(rows[0].id),
          username: rows[0].username,
          role: rows[0].role,
        };
        console.log('[AUTH USER]', req.user);
      } else {
        req.user = null;
      }
    // } 
    // catch {
    //   req.user = null;
    // }
    } catch (error) {
  console.error('[AUTH ERROR]', error.message);
  req.user = null;
}
  }
  next();
}

/** Require a logged-in user. */
export async function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Login required.' });
  }
  next();
}

/** Require admin panel access (super_admin or farmer role). */
export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Login required.' });
  }
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'This account does not have admin access.' });
  }
  next();
}

/** Require the super admin role (role management only). */
export async function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only the Super Admin can do this.' });
  }
  next();
}