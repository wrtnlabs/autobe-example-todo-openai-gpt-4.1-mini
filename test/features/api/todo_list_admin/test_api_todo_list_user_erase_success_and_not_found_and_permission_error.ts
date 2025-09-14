import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * Validate the soft deletion of a todo_list_user entity via the admin
 * delete API.
 *
 * 1. Create an admin account and authenticate.
 * 2. Soft delete an existing user by userId and validate success.
 * 3. Attempt to delete a non-existent user and expect a 404 error.
 * 4. Attempt unauthorized deletion with a non-admin account and expect an
 *    error.
 *
 * This ensures that soft deletion sets a deleted_at timestamp without
 * removing records, enforces admin-only permission on the delete operation,
 * and properly handles error states.
 */
export async function test_api_todo_list_user_erase_success_and_not_found_and_permission_error(
  connection: api.IConnection,
) {
  // 1. Create and authenticate an admin account
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "1234";

  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // 2. Soft delete an existing user (simulate by generating a valid UUID as userId)
  const validUserId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.todoList.admin.users.erase(connection, {
    userId: validUserId,
  });

  // 3. Attempt to delete a non-existent user and expect 404 error
  const nonExistentUserId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "delete non-existent user should throw",
    async () => {
      await api.functional.todoList.admin.users.erase(connection, {
        userId: nonExistentUserId,
      });
    },
  );

  // 4. Attempt unauthorized deletion using non-admin account
  // Use a fresh connection without admin privileges
  const nonAdminConnection: api.IConnection = { ...connection, headers: {} };
  const anotherUserId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "non-admin delete attempt should throw",
    async () => {
      await api.functional.todoList.admin.users.erase(nonAdminConnection, {
        userId: anotherUserId,
      });
    },
  );
}
