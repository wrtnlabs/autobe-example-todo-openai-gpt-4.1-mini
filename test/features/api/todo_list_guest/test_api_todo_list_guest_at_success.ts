import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

/**
 * Validates that an admin can retrieve detailed information on a single guest
 * entity.
 *
 * The test performs:
 *
 * 1. Admin account creation through /auth/admin/join to establish authentication.
 * 2. Guest account creation through /auth/guest/join to obtain guestId.
 * 3. Retrieval of guest details by the admin via /todoList/admin/guests/{guestId}.
 * 4. Validation that the retrieved guest details match the created guest.
 */
export async function test_api_todo_list_guest_at_success(
  connection: api.IConnection,
) {
  // Step 1: Create admin user to get authentication context
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListAdmin.ICreate;

  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // Step 2: Create guest user to get guest ID
  const guest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  typia.assert(guest);

  // Validate guest id for format
  TestValidator.predicate(
    "guestId is a valid UUID",
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      guest.id,
    ),
  );

  // Step 3: Retrieve guest details by admin using guestId
  const retrievedGuest: ITodoListGuest =
    await api.functional.todoList.admin.guests.at(connection, {
      guestId: guest.id,
    });
  typia.assert(retrievedGuest);

  // Validate retrieved guest id and timestamps
  TestValidator.equals(
    "retrieved guest id matches created guest",
    retrievedGuest.id,
    guest.id,
  );
  TestValidator.equals(
    "retrieved guest created_at matches",
    retrievedGuest.created_at,
    guest.created_at,
  );
  TestValidator.equals(
    "retrieved guest updated_at matches",
    retrievedGuest.updated_at,
    guest.updated_at,
  );
  TestValidator.equals(
    "retrieved guest deleted_at matches",
    retrievedGuest.deleted_at ?? null,
    guest.deleted_at ?? null,
  );
}
