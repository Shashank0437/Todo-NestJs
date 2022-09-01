import { User } from '../../auth/entity/user.entity';
import { TodoDto } from '../dto/todo.dto';
import { Todo } from '../entity/todo.entity';
import { AppDataSource } from '../../data-source';

export const TodoRepository = AppDataSource.getRepository(Todo).extend({
  async createTodo(todoDto: TodoDto, user: User): Promise<Todo> {
    const { title, description } = todoDto;

    const todo = new Todo();

    todo.title = title;
    todo.description = description;
    todo.user = user;

    await todo.save();

    delete todo.user;
    return todo;
  },

  async getAllTodo(user: User): Promise<Todo[]> {
    const query = this.createQueryBuilder('todo');

    query.where('todo.userId = :userId', { userId: user.id });

    const todos = await query.getMany();
    return todos;
  },
});
