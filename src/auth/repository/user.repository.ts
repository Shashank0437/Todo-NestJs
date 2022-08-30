import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserInfo } from '../../user/entity/user-info.entity';
import { AppDataSource } from '../../data-source';

import { SignupCredentialsDto } from '../dto/signup-credentials.dto';
import { User } from '../entity/user.entity';
import { SignInCredentialsDto } from '../dto/signin-credentials.dto';
import { JwtPayload } from '../interface/jwt-payload.interface';

export const UserRepository = AppDataSource.getRepository(User).extend({
  async signUp(signupCredentialsDto: SignupCredentialsDto) {
    const { username, password } = signupCredentialsDto;

    const user = new User();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      const userInfo = new UserInfo();
      await userInfo.save();

      user.user_info = userInfo;
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  },

  async validateUserPassword(
    signinCredentialDto: SignInCredentialsDto,
  ): Promise<JwtPayload> {
    const { username, password } = signinCredentialDto;
    const auth = await this.findOneBy({ username: username });

    if (auth && (await auth.validatePassword(password))) {
      return {
        username: auth.username,
        user_info: auth.user_info,
      };
    } else {
      return null;
    }
  },

  async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  },
});
