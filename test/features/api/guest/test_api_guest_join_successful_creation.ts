import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

export async function test_api_guest_join_successful_creation(
  connection: api.IConnection,
) {
  // 1. Call the guest join API endpoint to create a temporary guest account.
  const guest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  // 2. Assert the response matches the expected ITodoListGuest.IAuthorized type.
  typia.assert(guest);

  // 3. Validate the critical fields exist and have expected properties.
  TestValidator.predicate(
    "guest.id is a valid UUID",
    typeof guest.id === "string" && guest.id.length === 36,
  );
  TestValidator.predicate(
    "guest.created_at is ISO date-time string",
    typeof guest.created_at === "string" &&
      !isNaN(Date.parse(guest.created_at)),
  );
  TestValidator.predicate(
    "guest.updated_at is ISO date-time string",
    typeof guest.updated_at === "string" &&
      !isNaN(Date.parse(guest.updated_at)),
  );
  TestValidator.equals(
    "guest.deleted_at initially null",
    guest.deleted_at ?? null,
    null,
  );

  // 4. Validate the token object integrity and expiration timestamps
  TestValidator.predicate(
    "token.access is non-empty string",
    typeof guest.token.access === "string" && guest.token.access.length > 0,
  );
  TestValidator.predicate(
    "token.refresh is non-empty string",
    typeof guest.token.refresh === "string" && guest.token.refresh.length > 0,
  );
  TestValidator.predicate(
    "token.expired_at is ISO date-time string",
    typeof guest.token.expired_at === "string" &&
      !isNaN(Date.parse(guest.token.expired_at)),
  );
  TestValidator.predicate(
    "token.refreshable_until is ISO date-time string",
    typeof guest.token.refreshable_until === "string" &&
      !isNaN(Date.parse(guest.token.refreshable_until)),
  );
}
