import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfo } from './entity/user-info.entity';
import { UserService } from './service/user-info.service';
import { UserController } from './user.controller';
import * as path from 'path';

@Module({
  imports: [
    MulterModule.register({
      dest: path.join(__dirname, '../.././uploads/'),
    }),
    TypeOrmModule.forFeature([UserInfo]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
