import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { env, isDev } from '../config/env.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { ADMIN_ROLES, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendMail } from '../utils/mailer.js';
import { uploadImage, deleteCloudinaryImage, publicIdFromUrl } from '../utils/cloudinary.js';

const PASSWORD_RESET_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}****@${domain}`;
}

export function validatePasswordStrength(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/\d/.test(password)) return 'Password must include a digit.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character.';
  return null;
}

async function logPasswordActivity(userId, action, ip = '') {
  await pool.query(
    `INSERT INTO password_change_logs (user_id, action, ip_address) VALUES ($1, $2, $3)`,
    [userId, action, ip]
  ).catch(() => {});
}

async function findUserByIdentifier(identifier) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.password, u.avatar_url,
            COALESCE(m.role, 'user') AS role, COALESCE(m.is_active, 1) AS is_active
     FROM users u
     LEFT JOIN user_accounts_meta m ON m.user_id = u.id
     WHERE u.username = $1 OR u.email = $1
     LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

/* ---------------------------------------------------------------- signup */

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || username.length < 3) return res.status(422).json({ success: false, message: 'Username must be at least 3 characters.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ success: false, message: 'Enter a valid email address.' });
  if (!password || password.length < 8) return res.status(422).json({ success: false, message: 'Password must be at least 8 characters.' });
  if (password !== confirmPassword) return res.status(422).json({ success: false, message: 'Passwords do not match.' });
  if (!req.file) return res.status(422).json({ success: false, message: 'A profile picture is required. Please upload one.' });

  const dup = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $1 LIMIT 1', [username]);
  if (dup.rows.length) return res.status(409).json({ success: false, message: 'Username or email already exists.' });

  const { url: avatarUrl, publicId: avatarPublicId } = await uploadImage(req.file.buffer, 'avatars');

  const hash = await bcrypt.hash(password, 12);
  const user = await pool.query(
    'INSERT INTO users (username, email, password, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id',
    [username, email, hash, avatarUrl]
  );
  const userId = user.rows[0].id;

  await pool.query(
    `INSERT INTO user_accounts_meta (user_id, role, is_active) VALUES ($1, 'user', 1)
     ON CONFLICT (user_id) DO UPDATE SET role = 'user', is_active = 1`,
    [userId]
  );

  const payload = { id: userId, username, role: 'user' };
  const token = signToken(payload);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { id: userId, username, role: 'user', avatar_url: avatarUrl },
  });
});

/* ----------------------------------------------------------------- login */

export const login = asyncHandler(async (req, res) => {
  const { username, password, loginType } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
  const type = ['admin', 'super_admin'].includes(loginType) ? loginType : 'user';

  const user = await findUserByIdentifier(username || '');
  const ip = req.ip || req.socket?.remoteAddress || '';

  const logAttempt = async (status) => {
    await pool.query(
      `INSERT INTO login_activity (user_id, username, status, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user?.id || null, username || '', status, ip, (req.headers['user-agent'] || '').slice(0, 250)]
    ).catch(() => {});
  };

  let passwordMatches = false;
  if (user && typeof user.password === 'string') {
    try {
      passwordMatches = await bcrypt.compare(password || '', user.password);
    } catch {
      passwordMatches = false;
    }
  }

  if (!passwordMatches) {
    await logAttempt('failed');
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
  if (Number(user.is_active) !== 1) {
    await logAttempt('failed');
    return res.status(403).json({ success: false, message: 'Your account is currently inactive. Please contact support.' });
  }

  const isAdminRole = ADMIN_ROLES.includes(user.role);
  const isSuperRole = user.role === 'super_admin';
  if (type === 'user' && isAdminRole) {
    await logAttempt('failed');
    return res.status(403).json({ success: false, message: 'Admin account detected. Use the Farmer tab.' });
  }
  if (type === 'super_admin' && !isSuperRole) {
    await logAttempt('failed');
    return res.status(403).json({ success: false, message: 'Only a Super Admin account can log in here.' });
  }
  if (type === 'admin' && !isAdminRole) {
    await logAttempt('failed');
    return res.status(403).json({ success: false, message: 'This account does not have admin access.' });
  }

  await logAttempt('success');

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      avatar_url: user.avatar_url || null,
      isUser: type === 'user',
      isAdmin: isAdminRole,
      redirect: isSuperRole ? '/super-admin' : isAdminRole ? '/farmer' : '/dashboard',
    },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not logged in.' });
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.avatar_url, COALESCE(m.role, 'user') AS role
     FROM users u
     LEFT JOIN user_accounts_meta m ON m.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  const profile = rows[0] || {};
  res.json({
    success: true,
    data: {
      id: profile.id || req.user.id,
      username: profile.username || req.user.username,
      role: profile.role || req.user.role,
      avatar_url: profile.avatar_url || null,
    },
  });
});

/* ---------------------------------------------------------- update avatar */

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  if (!req.file) throw new ApiError(422, 'No image provided.');

  const { rows } = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
  const oldAvatar = rows[0]?.avatar_url || null;

  const { url: avatarUrl, publicId } = await uploadImage(req.file.buffer, 'avatars');

  if (oldAvatar) {
    const oldPublicId = publicIdFromUrl(oldAvatar);
    if (oldPublicId) await deleteCloudinaryImage(oldPublicId);
  }

  await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
  res.json({ success: true, data: { avatar_url: avatarUrl } });
});

/* ---------------------------------------------------------- change password */

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const { rows } = await pool.query('SELECT id, username, password FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ success: false, message: 'Account no longer exists. Please log in again.' });
  }

  if (!(await bcrypt.compare(currentPassword || '', user.password))) {
    await logPasswordActivity(user.id, 'password_change_current_password_failed', req.ip);
    return res.status(422).json({ success: false, message: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword !== confirmPassword) {
    return res.status(422).json({ success: false, message: 'New passwords do not match.' });
  }
  if (newPassword === currentPassword) {
    return res.status(422).json({ success: false, message: 'New password must differ from the current one.' });
  }
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) return res.status(422).json({ success: false, message: strengthError });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
  await logPasswordActivity(user.id, 'password_changed', req.ip);

  // Re-issue the token so existing sessions stay valid under the new password.
  const freshUser = { id: user.id, username: user.username, role: req.user.role };
  setAuthCookie(res, signToken(freshUser));

  res.json({ success: true, message: 'Password changed successfully.' });
});

/* ------------------------------------------------------------- OTP reset */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) throw new ApiError(422, 'Enter your username or email.');

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    // Do not reveal whether the account exists.
    return res.json({ success: true, message: 'If that account exists, a reset code has been sent.' });
  }

  // Expire any previous pending resets for this user.
  await pool.query(
    `UPDATE password_resets SET expires_at = NOW() WHERE user_id = $1 AND verified = 0 AND expires_at > NOW()`,
    [user.id]
  ).catch(() => {});

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const reset = await pool.query(
    `INSERT INTO password_resets (user_id, otp, expires_at, verified) VALUES ($1, $2, NOW() + ($3 || ' milliseconds')::interval, 0)
     RETURNING id`,
    [user.id, otpHash, PASSWORD_RESET_EXPIRY_MS]
  );
  const resetId = reset.rows[0].id;

  await logPasswordActivity(user.id, 'password_reset_requested', req.ip);

  const sent = await sendMail({
    to: user.email,
    subject: 'AgriSmart — Password Reset Code',
    text: `Your AgriSmart password reset code is: ${otp}\nIt expires in 10 minutes.`,
    html: `<p>Your AgriSmart password reset code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`,
  });

  const resetToken = jwt.sign(
    { rid: resetId, uid: user.id },
    env.JWT_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRY_MS / 1000 }
  );

  res.json({
    success: true,
    message: 'A reset code has been sent to your email.',
    data: {
      resetToken,
      maskedEmail: maskEmail(user.email),
      // Development convenience only:
      devOtp: isDev() && sent.devLogOnly ? otp : undefined,
    },
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { resetToken, otp } = req.body;
  let claims;
  try {
    claims = jwt.verify(resetToken || '', env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Reset session expired. Start again.' });
  }
  if (claims.verified) {
    return res.json({ success: true, data: { resetToken } });
  }

  const { rows } = await pool.query(
    `SELECT pr.id, pr.otp, pr.expires_at, pr.verified, pr.attempts, u.username, u.email
     FROM password_resets pr INNER JOIN users u ON u.id = pr.user_id
     WHERE pr.id = $1 AND pr.user_id = $2 LIMIT 1`,
    [claims.rid, claims.uid]
  );
  const reset = rows[0];
  if (!reset) return res.status(404).json({ success: false, message: 'Reset request not found. Start again.' });
  if (reset.verified) throw new ApiError(409, 'This code was already used.');

  const kathmanduNow = new Date(new Date().getTime() + 5.75 * 3600 * 1000);
  if (new Date(reset.expires_at) < kathmanduNow) {
    await logPasswordActivity(claims.uid, 'password_reset_expired', req.ip);
    return res.status(410).json({ success: false, message: 'This code has expired. Request a new one.' });
  }

  const attempts = Number(reset.attempts || 0);
  if (attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    await logPasswordActivity(claims.uid, 'password_reset_locked', req.ip);
    return res.status(423).json({ success: false, message: 'Too many wrong attempts. Request a new code.' });
  }

  const ok = await bcrypt.compare(String(otp || ''), reset.otp);
  if (!ok) {
    await pool.query('UPDATE password_resets SET attempts = $1 WHERE id = $2', [attempts + 1, reset.id]);
    await logPasswordActivity(claims.uid, 'password_reset_otp_failed', req.ip);
    return res.status(422).json({
      success: false,
      message: 'Invalid code.',
      attemptsLeft: PASSWORD_RESET_MAX_ATTEMPTS - (attempts + 1),
    });
  }

  await pool.query('UPDATE password_resets SET verified = 1 WHERE id = $1', [reset.id]);
  await logPasswordActivity(claims.uid, 'password_reset_otp_verified', req.ip);

  const verifiedToken = jwt.sign(
    { rid: reset.id, uid: claims.uid, verified: true },
    env.JWT_SECRET,
    { expiresIn: 300 }
  );
  res.json({ success: true, data: { resetToken: verifiedToken } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  let claims;
  try {
    claims = jwt.verify(resetToken || '', env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Reset session expired. Start again.' });
  }
  if (!claims.verified) return res.status(401).json({ success: false, message: 'Verify the OTP first.' });
  if (!newPassword || newPassword !== confirmPassword) {
    return res.status(422).json({ success: false, message: 'Passwords do not match.' });
  }
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) return res.status(422).json({ success: false, message: strengthError });

  const { rowCount } = await pool.query(
    'SELECT 1 FROM password_resets WHERE id = $1 AND verified = 1',
    [claims.rid]
  );
  if (!rowCount) return res.status(401).json({ success: false, message: 'Reset flow invalidated. Start again.' });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, claims.uid]);
  await pool.query('UPDATE password_resets SET expires_at = NOW() WHERE id = $1', [claims.rid]);
  await logPasswordActivity(claims.uid, 'password_reset_completed', req.ip);

  res.json({ success: true, message: 'Password reset successfully. Please log in.' });
});