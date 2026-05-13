import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'gurukul-dev-s3cr3t-ch4ng3-m3-1n-pr0duct10n';
const JWT_EXPIRY = '24h';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Create a signed JWT token for the given user ID.
 */
export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token and return its payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Set the auth token as an httpOnly cookie on the response.
 */
export function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie('gk_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });
  return token;
}

/**
 * Clear the auth cookie.
 */
export function clearAuthCookie(res) {
  res.clearCookie('gk_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Express middleware: reads the JWT from the cookie and sets req.userId.
 * Does NOT block unauthenticated requests — individual routes handle that.
 */
export function jwtMiddleware(req, res, next) {
  const token = req.cookies?.gk_token;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.userId = payload.userId;
    } catch {
      // Invalid/expired token — treat as unauthenticated
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}
