import bcrypt from 'bcrypt';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

import { Response } from 'express';

import { config } from '@/config';
import { UserResponse } from '@/models/user';
import { JwtExpiresIn } from '@/config/index';

// Generate JWT token for authenticated users
export const generateToken = (user: Omit<UserResponse, "username">): string => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  let expiresIn;
  if (config.jwt.expiresIn) {
    expiresIn = config.jwt.expiresIn as JwtExpiresIn;
  }

  const options = {
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

// Verify JWT token
export const verifyToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password with hash
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Set refresh cookie
export function setRefreshCookie(res: Response, refreshToken: string) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('refreshToken', refreshToken, {
      httpOnly: true,
      expires: date,
      sameSite: 'none',
      secure: true,
      path: '/',
    }),
  );
}
