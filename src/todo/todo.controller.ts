import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '../auth/entity/user.entity';
import { TodoDto } from './dto/todo.dto';
import { Todo } from './entity/todo.entity';
import { TodoService } from './service/todo.service';
import { JwtTwoFactorGuard } from '../guards/jwt-two-factor.gaurd';

@ApiTags('Todo')
@ApiBearerAuth()
@Controller('todo')
@UseGuards(JwtTwoFactorGuard)
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Get()
  getAllTodo(@GetUser() user: User): Promise<Todo[]> {
    return this.todoService.getAllTodo(user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  createTodo(@Body() todoDto: TodoDto, @GetUser() user: User): Promise<Todo> {
    return this.todoService.createTodo(todoDto, user);
  }

  @Get('/:id')
  getTodoById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Todo> {
    return this.todoService.getTodoById(id, user);
  }

  @Patch('/:id')
  updateTodoById(
    @Param('id', ParseIntPipe) id: number,
    @Body() todoDto: TodoDto,
    @GetUser() user: User,
  ): Promise<Todo> {
    return this.todoService.updateTodoById(id, todoDto, user);
  }

  @Delete('/:id')
  deleteTodoById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.todoService.deleteTodoById(id, user);
  }
}
