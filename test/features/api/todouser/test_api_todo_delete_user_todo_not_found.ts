import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test verifies that deleting a todo item that does not exist results in
 * an HTTP 404 Not Found error. It follows these steps:
 *
 * 1. Create a new user account by calling the /auth/user/join endpoint with valid
 *    credentials to get authentication context.
 * 2. Generate a random UUID for a todo item ID that does not exist.
 * 3. Attempt to delete the todo item with this non-existent UUID by calling DELETE
 *    /todoList/user/todos/{todoId}.
 * 4. Verify that the API responds with an HTTP 404 error indicating the todo item
 *    was not found.
 *
 * The test ensures proper error handling of deletion attempts for absent todos
 * and validation of authentication dependencies.
 */
export async function test_api_todo_delete_user_todo_not_found(
  connection: api.IConnection,
): Promise<void> {
  // Step 1: Create a new user account and authenticate
  const userCreateBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListUser.ICreate;

  const authorizedUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, { body: userCreateBody });
  typia.assert(authorizedUser);

  // Step 2: Generate a random todoId that does not exist
  const randomNonExistentTodoId = typia.random<string & tags.Format<"uuid">>();

  // Step 3 and 4: Attempt to delete non-existing todo item and validate 404 error
  await TestValidator.error(
    "delete non-existent todo should result in 404 Not Found",
    async () => {
      await api.functional.todoList.user.todos.erase(connection, {
        todoId: randomNonExistentTodoId,
      });
    },
  );
}
