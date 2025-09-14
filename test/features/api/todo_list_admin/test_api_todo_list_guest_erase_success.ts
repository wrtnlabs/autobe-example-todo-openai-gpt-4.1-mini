import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

/**
 * This test validates the administrative hard delete functionality for
 * guest users.
 *
 * Business Purpose:
 *
 * - Ensure that administrators can permanently delete guest user records.
 * - Confirm that guest users are created and exist before deletion.
 * - Verify admin authentication is required for deletion.
 *
 * Workflow Steps:
 *
 * 1. Create and authenticate an admin user (POST /auth/admin/join).
 * 2. Create a guest user to obtain guestId (POST /auth/guest/join).
 * 3. As the authenticated admin user, delete the guest user record (DELETE
 *    /todoList/admin/guests/{guestId}).
 * 4. Confirm deletion success with no content returned.
 *
 * Assertions:
 *
 * - All responses are type validated.
 * - The guest user ID used for deletion matches the created guest.
 * - No content is returned from the delete endpoint.
 */
export async function test_api_todo_list_guest_erase_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminPayload = {
    email: RandomGenerator.alphaNumeric(6) + "@example.com",
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListAdmin.ICreate;

  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: adminPayload,
    });
  typia.assert(admin);

  // 2. Guest user creation
  const guest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  typia.assert(guest);

  // 3. Admin deletes the guest user
  await api.functional.todoList.admin.guests.erase(connection, {
    guestId: guest.id,
  });

  // No response to validate as per void return type
}
