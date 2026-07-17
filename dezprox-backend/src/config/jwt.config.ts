import { registerAs } from '@nestjs/config';

export default registerAs('jwt', (): { 
  secret: string; 
  refreshSecret: string; 
  expiresIn: string; 
  refreshExpiresIn: string; 
} => {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'];
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  });

  return {
    secret: process.env.JWT_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN as string,
  };
});
