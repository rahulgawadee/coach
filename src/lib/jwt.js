import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

export const generateToken = (userId, email, role) => {
  return jwt.sign(
    {
      id: userId,
      email: email,
      role: role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
    }
  );
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      decoded,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
