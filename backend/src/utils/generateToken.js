import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mern_hostel_transport_2026';
  return jwt.sign(payload, secret, {
    expiresIn: '30d',
  });
};

