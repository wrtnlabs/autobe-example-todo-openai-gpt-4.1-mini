import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * Validates the administrative user token refresh functionality.
 *
 * This test performs the following workflow:
 *
 * 1. Creates an administrator account with a valid email and password.
 * 2. Ensures the admin join response contains a valid authorized admin object
 *    including tokens.
 * 3. Logs in with the admin credentials to retrieve initial access and refresh
 *    tokens.
 * 4. Uses the refresh token to request new tokens from the refresh endpoint.
 * 5. Asserts that the refresh tokens are properly issued and include valid
 *    expiry timestamps.
 *
 * The test ensures secure, continuous admin authentication without repeated
 * logins.
 */
export async function test_api_admin_token_refresh_success(
  connection: api.IConnection,
) {
  // Step 1: Create new administrator user
  const email = typia.random<string & tags.Format<"email">>();
  const password = "Password123!";

  const joinedAdmin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email,
        password,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(joinedAdmin);

  // Step 2: Login with the created administrator user
  const loginAdmin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: {
        email,
        password,
      } satisfies ITodoListAdmin.ILogin,
    });
  typia.assert(loginAdmin);

  // Step 3: Refresh tokens using refresh token from login
  const refreshedAdmin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.refresh.refreshAdmin(connection, {
      body: {
        refreshToken: loginAdmin.token.refresh,
      } satisfies ITodoListAdmin.IRefresh,
    });
  typia.assert(refreshedAdmin);

  // Step 4: Validate that the refreshed tokens include valid expiry timestamps
  const accessToken = refreshedAdmin.token.access;
  const refreshToken = refreshedAdmin.token.refresh;
  const expiredAt = refreshedAdmin.token.expired_at;
  const refreshableUntil = refreshedAdmin.token.refreshable_until;

  TestValidator.predicate(
    "refreshed access token should be a non-empty string",
    typeof accessToken === "string" && accessToken.length > 0,
  );
  TestValidator.predicate(
    "refreshed refresh token should be a non-empty string",
    typeof refreshToken === "string" && refreshToken.length > 0,
  );

  TestValidator.predicate(
    "refreshed expired_at should be a valid ISO date-time string",
    typeof expiredAt === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
        expiredAt,
      ),
  );
  TestValidator.predicate(
    "refreshed refreshable_until should be a valid ISO date-time string",
    typeof refreshableUntil === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
        refreshableUntil,
      ),
  );
}
