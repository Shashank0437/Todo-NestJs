import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../entity/user.entity';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { UserRepository } from '../repository/user.repository';

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey:
        process.env.JWT_REFRESH_TOKEN_SECRET || jwtConfig.refreshSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload;
    const user = await UserRepository.findOne({
      where: { username: username },
    });

    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.isTwoFactorEnable) {
      return user;
    }
    if (payload.isTwoFaAuthenticated) {
      return user;
    }
  }
}
