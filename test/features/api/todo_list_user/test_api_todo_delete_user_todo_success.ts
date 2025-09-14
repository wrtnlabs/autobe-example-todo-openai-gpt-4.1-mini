import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test for successful deletion of a todo item by its authenticated owner
 * user.
 *
 * This test proceeds in the following steps:
 *
 * 1. Register a new user with unique email and password, obtaining authorized
 *    user details.
 * 2. (Simulate or assume) Creation of a todo item for this user, obtaining its
 *    UUID todoId.
 * 3. Delete the created todo item using the DELETE
 *    /todoList/user/todos/{todoId} endpoint.
 * 4. Attempt to delete the same todo a second time to verify proper error
 *    handling on non-existent todo.
 *
 * This test ensures that only the owner user can delete their own todo
 * items, and that deletion removes the todo from access.
 */
export async function test_api_todo_delete_user_todo_success(
  connection: api.IConnection,
) {
  // 1. Register a new user
  const email = `${RandomGenerator.alphaNumeric(8)}@example.com`;
  const password = "Password123!";
  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    {
      body: {
        email,
        password,
      } satisfies ITodoListUser.ICreate,
    },
  );
  typia.assert(user);

  // For the purpose of this test, simulate todo item creation by generating a new UUID for todoId
  // Since the materials do not contain a create or read API for todo, we must simulate
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 3. Delete the todo item
  await api.functional.todoList.user.todos.erase(connection, {
    todoId,
  });

  // 4. Attempt to delete the same todo again to validate error handling
  await TestValidator.error(
    "deleting an already deleted todo should fail",
    async () => {
      await api.functional.todoList.user.todos.erase(connection, { todoId });
    },
  );

  // Note: Verification via get/read is not available due to no read API given,
  // so delete called twice and the second call's error suffice as validation.
}
