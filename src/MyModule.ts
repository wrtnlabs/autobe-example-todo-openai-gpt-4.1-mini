import { Module } from "@nestjs/common";

import { AuthUserController } from "./controllers/auth/user/AuthUserController";
import { TodolistappUserTodolistappusersController } from "./controllers/todoListApp/user/todoListAppUsers/TodolistappUserTodolistappusersController";
import { TodolistappUserTodolistappusersTodolistapptodoitemsController } from "./controllers/todoListApp/user/todoListAppUsers/todoListAppTodoItems/TodolistappUserTodolistappusersTodolistapptodoitemsController";

@Module({
  controllers: [
    AuthUserController,
    TodolistappUserTodolistappusersController,
    TodolistappUserTodolistappusersTodolistapptodoitemsController,
  ],
})
export class MyModule {}
