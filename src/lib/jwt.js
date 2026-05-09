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
    if (!token) return { valid: false, error: 'No token provided' };
    
    // Support full Bearer headers being passed in
    let cleanToken = token;
    if (token.startsWith('Bearer ')) {
      cleanToken = token.slice(7);
    }
    
    console.log('JWT Debug - Verifying token (first 10 chars):', cleanToken.substring(0, 10));
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    return {
      valid: true,
      decoded,
      userId: decoded.id,
      id: decoded.id, // For backward compatibility
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
