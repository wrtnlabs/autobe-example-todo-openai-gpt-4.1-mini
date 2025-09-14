import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * This test verifies that deleting a non-existent todo item by an admin
 * results in a 404 Not Found error.
 *
 * Steps:
 *
 * 1. Create an administrator account with a valid unique email and password.
 * 2. Attempt to delete a todo using a randomly generated UUID that does not
 *    exist.
 * 3. Assert that the operation throws an error, specifically indicating a 404
 *    status.
 */
export async function test_api_todo_delete_admin_todo_not_found(
  connection: api.IConnection,
) {
  // 1. Create admin account
  const email = typia.random<string & tags.Format<"email">>();
  const password = "Password123!";
  const admin = await api.functional.auth.admin.join.joinAdmin(connection, {
    body: { email, password } satisfies ITodoListAdmin.ICreate,
  });
  typia.assert(admin);

  // 2. Attempt to delete non-existent todo
  const fakeTodoId = typia.random<string & tags.Format<"uuid">>();

  // 3. Expect 404 Not Found error
  await TestValidator.error(
    "Deleting non-existent todo should throw 404 error",
    async () => {
      await api.functional.todoList.admin.todos.erase(connection, {
        todoId: fakeTodoId,
      });
    },
  );
}
