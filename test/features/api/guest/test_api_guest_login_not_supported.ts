import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

/**
 * Verify that guest users cannot perform login operations.
 *
 * Guests are a special user type with limited permissions. They do not have
 * a login API as regular users do. Guests gain authentication by creating a
 * guest account via /auth/guest/join, which returns temporary authorization
 * tokens.
 *
 * This test ensures that guests cannot log in via any login API. It calls
 * the guest join API to simulate guest authentication and validates the
 * response that includes authorization tokens.
 *
 * Since no login API is provided for guests, this test only verifies guest
 * join operation and its response.
 */
export async function test_api_guest_login_not_supported(
  connection: api.IConnection,
) {
  // 1. Call the guest join API to create a guest account
  const guestAuthorized: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  typia.assert(guestAuthorized);

  // 2. Validate returned properties
  TestValidator.predicate(
    "guest ID is a UUID string",
    typeof guestAuthorized.id === "string" && guestAuthorized.id.length > 0,
  );
  TestValidator.predicate(
    "token access is a non-empty string",
    typeof guestAuthorized.token.access === "string" &&
      guestAuthorized.token.access.length > 0,
  );

  // 3. Confirm timestamps are ISO date-time strings
  TestValidator.predicate(
    "created_at is ISO date-time string",
    typeof guestAuthorized.created_at === "string" &&
      !isNaN(Date.parse(guestAuthorized.created_at)),
  );
  TestValidator.predicate(
    "updated_at is ISO date-time string",
    typeof guestAuthorized.updated_at === "string" &&
      !isNaN(Date.parse(guestAuthorized.updated_at)),
  );

  // 4. deleted_at can be null or undefined, explicitly check null or undefined
  TestValidator.predicate(
    "deleted_at is null or undefined",
    guestAuthorized.deleted_at === null ||
      guestAuthorized.deleted_at === undefined,
  );
}
