import jwt from "jsonwebtoken";

/**
 * Sign JWT token with user info and organizationId
 * @param {Object} payload - Must contain: sub (userId), role, organizationId (optional)
 */
export function signToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret);
}