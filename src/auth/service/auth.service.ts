import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInCredentialsDto } from '../dto/signin-credentials.dto';
import { SignupCredentialsDto } from '../dto/signup-credentials.dto';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { UserRepository } from '../repository/user.repository';
import * as config from 'config';
import * as bcrypt from 'bcryptjs';
import { User } from '../entity/user.entity';

const jwtConfig = config.get('jwt');

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  async signUp(
    signupCredentialsDto: SignupCredentialsDto,
  ): Promise<{ message: string }> {
    return UserRepository.signUp(signupCredentialsDto);
  }

  async signIn(signInCredentialsDto: SignInCredentialsDto): Promise<{
    accessToken: string;
    refreshToken?: string;
    user?: JwtPayload;
  }> {
    const resp = await UserRepository.validateUserPassword(
      signInCredentialsDto,
    );
    if (!resp) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.getAccessToken(resp);
    if (resp.isTwoFactorEnable) {
      return {
        accessToken,
      };
    }
    const refreshToken = await this.getRefreshToken(resp);

    await this.updateRefreshTokenInUser(refreshToken, resp.username);

    return {
      accessToken,
      refreshToken,
      user: resp,
    };
  }

  async signOut(user: User) {
    await this.updateRefreshTokenInUser(null, user.username);
  }

  async updateRefreshTokenInUser(refreshToken, username) {
    if (refreshToken) {
      refreshToken = await bcrypt.hash(refreshToken, 10);
    }

    await UserRepository.update(
      { username: username },
      {
        hashedRefreshToken: refreshToken,
      },
    );
  }

  async getAccessToken(payload: JwtPayload) {
    const accessToken = await this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET || jwtConfig.secret,
      expiresIn:
        +process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || jwtConfig.expiresIn,
    });
    return accessToken;
  }

  async getRefreshToken(payload: JwtPayload) {
    const refreshToken = await this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET || jwtConfig.refreshSecret,
      expiresIn:
        +process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME ||
        jwtConfig.refreshExpiresIn,
    });
    return refreshToken;
  }

  async getNewAccessAndRefreshToken(payload: JwtPayload) {
    const refreshToken = await this.getRefreshToken(payload);
    await this.updateRefreshTokenInUser(refreshToken, payload.username);

    return {
      accessToken: await this.getAccessToken(payload),
      refreshToken: refreshToken,
    };
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, username: string) {
    const user = await UserRepository.getUserInfoByUsername(username);

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      await this.updateRefreshTokenInUser(null, username);
      return user;
    } else {
      throw new UnauthorizedException();
    }
  }
}
