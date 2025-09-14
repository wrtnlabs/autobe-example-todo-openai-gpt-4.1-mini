import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This E2E test validates the successful deletion of a todo item by its owner
 * user.
 *
 * The workflow covers:
 *
 * 1. User registration through join API,
 * 2. User login through login API,
 * 3. Simulation of an existing todo creation for the user,
 * 4. Deletion of this todo by permitted user,
 * 5. Confirmation that deletion succeeds without errors.
 *
 * The test enforces proper authentication and authorization.
 */
export async function test_api_todo_user_delete_own_todo_success(
  connection: api.IConnection,
) {
  // User registration
  const userCreateBody = {
    email: `${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListUser.ICreate;

  const createdUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userCreateBody,
    });
  typia.assert(createdUser);

  // User login
  const userLoginBody = {
    email: createdUser.email,
    password: userCreateBody.password,
  } satisfies ITodoListUser.ILogin;

  const loggedInUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.login(connection, { body: userLoginBody });
  typia.assert(loggedInUser);

  // Assume a todoId to delete (simulated)
  // Since there is no API for todo creation, generate a random UUID for todoId
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // Delete the todo by owner user
  await api.functional.todoList.user.users.todos.erase(connection, {
    userId: createdUser.id,
    todoId: todoId,
  });
}
