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

/**
 * Test update attempt of a todo item without admin authorization. The scenario
 * attempts to update a todo item without authentication or with user
 * authentication instead of admin. It verifies that the request is rejected
 * with an unauthorized error. This prevents unauthorized users from updating
 * admin-restricted resources.
 */
export async function test_api_todolist_admin_todos_update_unauthorized(
  connection: api.IConnection,
) {
  // 1. User joins and authenticates
  const userEmail = typia.random<string & tags.Format<"email">>();
  const userPassword = "password123";
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

  // 2. User gets list of todos
  const todoPage: IPageITodoListTodo.ISummary =
    await api.functional.todoList.user.todos.index(connection, {
      body: {
        page: 1,
        limit: 10,
      } satisfies ITodoListTodo.IRequest,
    });
  typia.assert(todoPage);

  TestValidator.predicate(
    "user must have at least one todo",
    todoPage.data.length >= 1,
  );

  const todoId: string & tags.Format<"uuid"> = todoPage.data[0].id;

  // Prepare update body to attempt
  const updateBody = {
    title: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    description: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 5,
      sentenceMax: 10,
      wordMin: 4,
      wordMax: 8,
    }),
    status: "completed",
  } satisfies ITodoListTodo.IUpdate;

  // 3. Attempt update without authentication - expect error
  await TestValidator.error(
    "updating admin todo without authentication",
    async () => {
      await api.functional.todoList.admin.todos.update(connection, {
        todoId: todoId,
        body: updateBody,
      });
    },
  );

  // 4. Attempt update with user authentication (not admin) - expect error
  await api.functional.auth.user.login(connection, {
    body: {
      email: userEmail,
      password: userPassword,
    } satisfies ITodoListUser.ILogin,
  });

  await TestValidator.error(
    "updating admin todo with user authentication",
    async () => {
      await api.functional.todoList.admin.todos.update(connection, {
        todoId: todoId,
        body: updateBody,
      });
    },
  );

  // 5. Admin joins to complete multi-actor setup
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "adminPass123";
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // 6. Admin login
  await api.functional.auth.admin.login.loginAdmin(connection, {
    body: {
      email: adminEmail,
      password: adminPassword,
    } satisfies ITodoListAdmin.ILogin,
  });

  // 7. Switch back to user login
  await api.functional.auth.user.login(connection, {
    body: {
      email: userEmail,
      password: userPassword,
    } satisfies ITodoListUser.ILogin,
  });
}
