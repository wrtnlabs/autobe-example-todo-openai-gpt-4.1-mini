import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

export async function test_api_guest_refresh_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Create guest account to obtain initial tokens
  const guest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  typia.assert(guest);

  // 2. Refresh tokens with valid refresh token from guest
  const refreshedGuest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.refresh.refreshGuest(connection, {
      body: {
        refresh_token: guest.token.refresh,
      } satisfies ITodoListGuest.IRefresh,
    });
  typia.assert(refreshedGuest);

  TestValidator.predicate(
    "guest id is UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      guest.id,
    ),
  );

  TestValidator.equals(
    "guest id matches after refresh",
    refreshedGuest.id,
    guest.id,
  );

  TestValidator.predicate(
    "access token is non-empty string",
    typeof refreshedGuest.token.access === "string" &&
      refreshedGuest.token.access.length > 0,
  );

  TestValidator.predicate(
    "refresh token is non-empty string",
    typeof refreshedGuest.token.refresh === "string" &&
      refreshedGuest.token.refresh.length > 0,
  );

  // 3. Attempt refresh with invalid refresh token
  await TestValidator.error(
    "refresh with invalid token should fail",
    async () => {
      await api.functional.auth.guest.refresh.refreshGuest(connection, {
        body: {
          refresh_token: RandomGenerator.alphaNumeric(32),
        } satisfies ITodoListGuest.IRefresh,
      });
    },
  );
}
