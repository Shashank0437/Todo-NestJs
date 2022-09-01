import { AuthService } from './auth.service';
import * as config from 'config';
import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { UserRepository } from '../repository/user.repository';

const dbConfig = config.get('jwt');

@Injectable()
export class TwoFactorAuthService {
  constructor(private authService: AuthService) {}

  public async generateTwoFactorAuthSecret(user: User) {
    const auth = await UserRepository.getUserInfoByUsername(user.username);
    if (auth) {
      if (auth.isTwoFactorEnable) {
        return {
          msg: 'Already QR generated',
        };
      }
    }

    const secret = authenticator.generateSecret();
    const app_name =
      process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME ||
      dbConfig.twoFactorAppName;
    const otpAuthUrl = authenticator.keyuri(user.username, app_name, secret);

    await UserRepository.update(
      { username: user.username },
      { twoFactorAuthSecret: secret },
    );
    return {
      secret,
      otpAuthUrl,
    };
  }

  public async qrCodeStreamPipe(stream: Response, otpPathUrl: string) {
    return toFileStream(stream, otpPathUrl);
  }

  public async activationOfTwoFa(email: string, status: boolean) {
    return await UserRepository.update(
      { username: email },
      {
        isTwoFactorEnable: status,
      },
    );
  }

  public async verifyTwoFaCode(code: string, user: User) {
    //console.log(code, user);
    return authenticator.verify({
      token: code,
      secret: user.twoFactorAuthSecret,
    });
  }

  async signIn(
    user: User,
    isTwoFaAuthenticated: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; user: JwtPayload }> {
    const data = {
      isTwoFaAuthenticated,
      isTwoFactorEnable: user.isTwoFactorEnable,
      username: user.username,
      user_info: user.user_info,
    };
    //console.log(data);
    const accessToken = await this.authService.getAccessToken(data);
    const refreshToken = await this.authService.getRefreshToken(data);

    await this.authService.updateRefreshTokenInUser(
      refreshToken,
      user.username,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        username: user.username,
        user_info: user.user_info,
      },
    };
  }
}
