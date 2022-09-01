import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from './strategy/jwt-strategy';
import { AuthService } from './service/auth.service';
import { JwtRefreshStrategy } from './strategy/jwt-refresh-strategy';
import { JwtTwoFaStrategy } from './strategy/jwt-2fa-strategy';
import { TwoFactorAuth } from './controller/two-factor-auth.controller';
import { TwoFactorAuthService } from './service/two-factor-auth.service';

@Global()
@Module({
  imports: [
    // PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule.register({
    //   secret: process.env.JWT_ACCESS_TOKEN_SECRET || jwtConfig.secret,
    //   signOptions: {
    //     expiresIn:
    //       +process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || jwtConfig.expiresIn,
    //   },
    // }),
    PassportModule.register({}),
    JwtModule.register({}),
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AuthController, TwoFactorAuth],
  providers: [
    AuthService,
    TwoFactorAuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFaStrategy,
  ],
  exports: [JwtStrategy, JwtRefreshStrategy, PassportModule, JwtTwoFaStrategy],
})
export class AuthModule {}
