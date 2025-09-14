import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

export async function test_api_todo_delete_admin_any_todo_happy_path(
  connection: api.IConnection,
) {
  // 1. Create admin user and capture credentials
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = RandomGenerator.alphaNumeric(12);
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);
  TestValidator.predicate(
    "admin id is UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      admin.id,
    ),
  );

  // 2. Create regular user and capture credentials
  const userEmail = typia.random<string & tags.Format<"email">>();
  const userPassword = RandomGenerator.alphaNumeric(12);
  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    {
      body: {
        email: userEmail,
        password: userPassword,
      } satisfies ITodoListUser.ICreate,
    },
  );
  typia.assert(user);
  TestValidator.predicate(
    "user id is UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      user.id,
    ),
  );

  // 3. Authenticate regular user (re-login to ensure session)
  await api.functional.auth.user.login(connection, {
    body: {
      email: userEmail,
      password: userPassword,
    } satisfies ITodoListUser.ILogin,
  });

  // 4. Fetch list of todo items for the regular user
  const requestBody = {
    page: 1,
    limit: 100,
  } satisfies ITodoListTodo.IRequest;
  const todoPage: IPageITodoListTodo.ISummary =
    await api.functional.todoList.user.todos.index(connection, {
      body: requestBody,
    });
  typia.assert(todoPage);

  // Ensure there is at least one todo item to delete
  TestValidator.predicate(
    "todo list has at least one item",
    todoPage.data.length > 0,
  );

  // Select one todo to delete
  const todoToDelete = todoPage.data[0];

  // 5. Authenticate the admin user (login to establish session)
  await api.functional.auth.admin.login.loginAdmin(connection, {
    body: {
      email: adminEmail,
      password: adminPassword,
    } satisfies ITodoListAdmin.ILogin,
  });

  // 6. Admin deletes the selected todo item owned by regular user
  await api.functional.todoList.admin.users.todos.erase(connection, {
    userId: user.id,
    todoId: todoToDelete.id,
  });
}
