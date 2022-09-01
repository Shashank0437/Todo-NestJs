import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthenticationGuard } from '../../guards/jwt-authentication.guard';
import { GetUser } from '../decorator/get-user.decorator';
import { TwoFaAuthDto } from '../dto/two-fa-auth.dto';
import { User } from '../entity/user.entity';
import { TwoFactorAuthService } from '../service/two-factor-auth.service';

@ApiTags('Two FA')
@Controller('2fa')
@UseInterceptors(ClassSerializerInterceptor)
export class TwoFactorAuth {
  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @Post('generate-qr')
  async generateQrCode(@Res() response: Response, @GetUser() user: User) {
    const { otpAuthUrl } =
      await this.twoFactorAuthService.generateTwoFactorAuthSecret(user);
    response.setHeader('content-type', 'image/png');
    return this.twoFactorAuthService.qrCodeStreamPipe(response, otpAuthUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @Post('turn-on-qr')
  async activationOfTwoFa(
    @GetUser() user: User,
    @Body(ValidationPipe) twoFaAuthDto: TwoFaAuthDto,
  ) {
    const isCodeValid = this.twoFactorAuthService.verifyTwoFaCode(
      twoFaAuthDto.code,
      user,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }
    await this.twoFactorAuthService.activationOfTwoFa(user.username, true);
  }

  @ApiBearerAuth()
  @Post('authenticate')
  @UseGuards(JwtAuthenticationGuard)
  async authenticate(
    @GetUser() user: User,
    @Body(ValidationPipe) twoFaAuthDto: TwoFaAuthDto,
  ) {
    const isCodeValid = await this.twoFactorAuthService.verifyTwoFaCode(
      twoFaAuthDto.code,
      user,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }
    console.log(isCodeValid);
    return await this.twoFactorAuthService.signIn(user, true);
  }
}
