import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test validates the successful deletion of a todo item owned by a user.
 * The full scenario includes user registration, todo item retrieval, and the
 * deletion operation.
 *
 * It checks that a user can delete their own todo item as expected by the API.
 * The workflow ensures the entire ownership and authorization flow is
 * functional.
 *
 * Key steps:
 *
 * 1. Register a new user
 * 2. Retrieve todo items for the user
 * 3. Delete the first todo item by the authorized user
 * 4. Validate all API responses and the final deletion
 */
export async function test_api_todo_delete_user_own_todo_happy_path(
  connection: api.IConnection,
) {
  // Step 1: Register a new user
  const userBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListUser.ICreate;

  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    { body: userBody },
  );
  typia.assert(user);

  // Step 2: Retrieve todo items by fetching with empty filter
  const todoFilter = {} satisfies ITodoListTodo.IRequest;
  const todos: IPageITodoListTodo.ISummary =
    await api.functional.todoList.user.todos.index(connection, {
      body: todoFilter,
    });
  typia.assert(todos);

  // Validate we have at least one todo item
  TestValidator.predicate(
    "should have at least one todo item",
    todos.data.length > 0,
  );

  // Step 3: Delete the first todo item by the owner
  const firstTodo = todos.data[0];
  TestValidator.predicate(
    "todo item id should be uuid format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      firstTodo.id,
    ),
  );

  await api.functional.todoList.user.users.todos.erase(connection, {
    userId: typia.assert<string & tags.Format<"uuid">>(user.id),
    todoId: typia.assert<string & tags.Format<"uuid">>(firstTodo.id),
  });

  // Step 4: Confirm deletion endpoint returns void
  // No return value expected, just ensure no exception was thrown
}
