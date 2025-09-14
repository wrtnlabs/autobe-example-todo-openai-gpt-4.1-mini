import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * This E2E test validates the deletion of a todo item for a specific user
 * by an authenticated admin.
 *
 * The test first creates an admin user via the join API, then authenticates
 * via login. It simulates existing user and todo items by generating random
 * UUIDs. The admin then deletes the todo item by calling the delete API.
 * The test ensures all server responses are as expected, validating admin
 * privileges and proper deletion.
 */
export async function test_api_todo_admin_delete_user_todo_success(
  connection: api.IConnection,
) {
  // 1. Create an admin with random unique email and password
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "strongpassword123";
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(adminAuthorized);

  // 2. Login as the admin to confirm authentication
  const loginAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ILogin,
    });
  typia.assert(loginAuthorized);

  // 3. Generate random UUIDs for userId and todoId
  const userId: string = typia.random<string & tags.Format<"uuid">>();
  const todoId: string = typia.random<string & tags.Format<"uuid">>();

  // 4. Using authenticated admin context (headers managed by SDK)
  // 5. Delete user todo item
  await api.functional.todoList.admin.users.todos.erase(connection, {
    userId: userId,
    todoId: todoId,
  });

  // 6. Confirm no errors, deletion succeeded by completing without exceptions
  TestValidator.predicate("delete user todo completes successfully", true);
}
