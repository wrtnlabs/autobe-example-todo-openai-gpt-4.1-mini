import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test function validates the successful retrieval of a todo item by
 * its ID for an authenticated user. It covers user registration,
 * authentication, and the secure retrieval of todo details.
 *
 * The process involves:
 *
 * 1. Registering a new user with generated email and password.
 * 2. Authenticating the user and retrieving their ID.
 * 3. Attempting to retrieve a todo item detail by a generated UUID todoId.
 * 4. Asserting the retrieved todo belongs to the authenticated user.
 * 5. Using typia.assert to validate the full response data structure.
 *
 * Because no todo creation API is available, the todoId used is random,
 * which may represent an existing or non-existing todo item; the test
 * validates the response conforms to the expected schema.
 *
 * All API calls properly await async operations, and authentication tokens
 * are handled automatically by the SDK.
 */
export async function test_api_todo_list_user_user_todo_detail_retrieve_success(
  connection: api.IConnection,
) {
  // 1. User registration and authentication
  const userCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@example.com",
    password: "password123",
  } satisfies ITodoListUser.ICreate;

  const authorizedUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userCreateBody,
    });
  typia.assert(authorizedUser);

  // 2. Retrieve todo details
  const todoId = typia.random<string & tags.Format<"uuid">>();
  const todo: ITodoListTodos =
    await api.functional.todoList.user.users.todos.at(connection, {
      userId: authorizedUser.id,
      todoId: todoId,
    });
  typia.assert(todo);

  // 3. Validate retrieved todo belongs to the user
  TestValidator.equals(
    "retrieved todo belongs to authorized user",
    todo.todo_list_user_id,
    authorizedUser.id,
  );
}
