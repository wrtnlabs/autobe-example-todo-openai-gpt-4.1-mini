import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * This end-to-end test verifies that an administrator can successfully
 * delete a todo item.
 *
 * Workflow:
 *
 * 1. Create an administrator account and authenticate via /auth/admin/join.
 * 2. Generate a todo UUID representing a todo item to be deleted.
 * 3. Invoke DELETE /todoList/admin/todos/{todoId} as the admin to delete the
 *    item.
 * 4. Confirm the operation completes without error, verifying admin deletion
 *    authority.
 *
 * This test ensures only valid properties and correct typing are used,
 * fulfilling all schema constraints.
 */
export async function test_api_todo_delete_admin_todo_success(
  connection: api.IConnection,
) {
  // 1. Admin joins (creates account and authenticates)
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: "securePassword123",
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(adminAuthorized);

  // 2. Generate a todoId to delete (mocked since creation API is unavailable)
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 3. Admin deletes the todo item
  await api.functional.todoList.admin.todos.erase(connection, {
    todoId,
  });

  // 4. No retrieval available; assume success if no errors thrown
}
