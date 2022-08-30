import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '../auth/entity/user.entity';

import { editFileName, imageFileFilter } from '../utils/file-upload.utils';
import { userInfoData } from './interface/user-info.interface';
import { diskStorage } from 'multer';
import { UserInfoDto } from './dto/user-info.dto';
import { UserService } from './service/user-info.service';
import * as path from 'path';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUserInfo(@GetUser() user: User): Promise<userInfoData> {
    console.log(user);
    return this.userService.getUser(user);
  }

  @Patch()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 2097152,
      },
      fileFilter: imageFileFilter,
      storage: diskStorage({
        destination: function (req, file, cb) {
          cb(null, path.join(__dirname, '../.././uploads/'));
        },
        filename: editFileName,
      }),
    }),
  )
  updateUserInfo(
    @UploadedFile() file,
    @Body() userInfoDto: UserInfoDto,
    @GetUser() user: User,
  ): Promise<userInfoData> {
    if (file) {
      userInfoDto.photo = file.originalname;
      userInfoDto.modified_photo = file.filename;
    }
    return this.userService.updateUserProfile(user, userInfoDto);
  }
}
