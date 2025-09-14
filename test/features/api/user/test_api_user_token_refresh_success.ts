import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test successful JWT token refresh for a registered user with valid refresh
 * token. This scenario begins with creating a new user account via the user
 * join endpoint using a valid email and password. The join operation provides
 * authorization tokens, including a refresh token. The test then uses the
 * refresh token from join to call the /auth/user/refresh endpoint to obtain new
 * JWT access and refresh tokens. This verifies that token refresh correctly
 * issues new tokens without requiring a login. Expected outcome is successful
 * token renewal with valid token values.
 */
export async function test_api_user_token_refresh_success(
  connection: api.IConnection,
) {
  // 1. Create a new user account with random valid email and password
  const email = typia.random<string & tags.Format<"email">>();
  const password = RandomGenerator.alphaNumeric(12); // 12 chars alphanumeric

  const joinBody = {
    email,
    password,
  } satisfies ITodoListUser.ICreate;

  const joinResponse: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, { body: joinBody });
  typia.assert(joinResponse);

  // 2. Use refresh token from join response to refresh tokens
  const refreshBody = {
    refresh_token: joinResponse.token.refresh,
  } satisfies ITodoListUser.IRefresh;

  const refreshResponse: ITodoListUser.IAuthorized =
    await api.functional.auth.user.refresh(connection, { body: refreshBody });
  typia.assert(refreshResponse);

  // 3. Validate that the refreshed tokens are different from original tokens
  TestValidator.notEquals(
    "refreshed access token should differ from original",
    refreshResponse.token.access,
    joinResponse.token.access,
  );
  TestValidator.notEquals(
    "refreshed refresh token should differ from original",
    refreshResponse.token.refresh,
    joinResponse.token.refresh,
  );
}
