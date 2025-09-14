import { Module } from "@nestjs/common";

import { AuthGuestJoinController } from "./controllers/auth/guest/join/AuthGuestJoinController";
import { AuthGuestRefreshController } from "./controllers/auth/guest/refresh/AuthGuestRefreshController";
import { AuthUserController } from "./controllers/auth/user/AuthUserController";
import { AuthAdminJoinController } from "./controllers/auth/admin/join/AuthAdminJoinController";
import { AuthAdminLoginController } from "./controllers/auth/admin/login/AuthAdminLoginController";
import { AuthAdminRefreshController } from "./controllers/auth/admin/refresh/AuthAdminRefreshController";
import { TodolistAdminGuestsController } from "./controllers/todoList/admin/guests/TodolistAdminGuestsController";
import { TodolistAdminUsersController } from "./controllers/todoList/admin/users/TodolistAdminUsersController";
import { TodolistUserTodosController } from "./controllers/todoList/user/todos/TodolistUserTodosController";
import { TodolistAdminTodosController } from "./controllers/todoList/admin/todos/TodolistAdminTodosController";
import { TodolistUserUsersTodosController } from "./controllers/todoList/user/users/todos/TodolistUserUsersTodosController";
import { TodolistAdminUsersTodosController } from "./controllers/todoList/admin/users/todos/TodolistAdminUsersTodosController";

@Module({
  controllers: [
    AuthGuestJoinController,
    AuthGuestRefreshController,
    AuthUserController,
    AuthAdminJoinController,
    AuthAdminLoginController,
    AuthAdminRefreshController,
    TodolistAdminGuestsController,
    TodolistAdminUsersController,
    TodolistUserTodosController,
    TodolistAdminTodosController,
    TodolistUserUsersTodosController,
    TodolistAdminUsersTodosController,
  ],
})
export class MyModule {}
