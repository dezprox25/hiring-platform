import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload: JwtPayload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
