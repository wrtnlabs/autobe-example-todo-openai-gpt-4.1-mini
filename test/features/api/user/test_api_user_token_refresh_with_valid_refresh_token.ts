import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

/**
 * Comprehensive E2E test for token refresh functionality of todo list app user
 * authentication.
 *
 * This test covers the full user authentication workflow:
 *
 * 1. User registration via /auth/user/join with valid email and password hash.
 * 2. User login via /auth/user/login to obtain access and refresh tokens.
 * 3. Token refresh by posting refresh token to /auth/user/refresh to receive new
 *    tokens.
 * 4. Verification that new tokens differ from initial tokens.
 * 5. Error scenario test for refresh with invalid token.
 *
 * All validations include typia asserts for complete type safety and
 * TestValidator to verify logical correctness.
 */
export async function test_api_user_token_refresh_with_valid_refresh_token(
  connection: api.IConnection,
) {
  // Step 1: User registration
  const userEmail = `e2e_test_${RandomGenerator.alphaNumeric(10)}@example.com`;
  const passwordPlain = "StrongP@ssw0rd!";
  const passwordHash = `hashed_${passwordPlain}`;
  const createBody = {
    email: userEmail,
    password_hash: passwordHash,
    email_verified: true,
  } satisfies ITodoListAppUser.ICreate;
  const createdUser: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: createBody,
    });
  typia.assert(createdUser);

  // Step 2: User login
  const loginBody = {
    email: userEmail,
    password: passwordPlain,
  } satisfies ITodoListAppUser.ILogin;
  const loginResult: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.login(connection, {
      body: loginBody,
    });
  typia.assert(loginResult);

  // Extract the initial tokens
  const initialAccessToken = loginResult.token.access;
  const initialRefreshToken = loginResult.token.refresh;

  // Tokens should be non-empty strings
  TestValidator.predicate(
    "initial access token is a non-empty string",
    typeof initialAccessToken === "string" && initialAccessToken.length > 0,
  );
  TestValidator.predicate(
    "initial refresh token is a non-empty string",
    typeof initialRefreshToken === "string" && initialRefreshToken.length > 0,
  );

  // Step 3: Use refresh token to obtain new tokens
  const refreshBody = {
    refreshToken: initialRefreshToken,
  } satisfies ITodoListAppUser.IRefresh;
  const refreshedResult: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.refresh(connection, {
      body: refreshBody,
    });
  typia.assert(refreshedResult);

  // Step 4: Validate tokens are new and valid
  TestValidator.predicate(
    "refreshed access token is a non-empty string",
    typeof refreshedResult.token.access === "string" &&
      refreshedResult.token.access.length > 0,
  );
  TestValidator.predicate(
    "refreshed refresh token is a non-empty string",
    typeof refreshedResult.token.refresh === "string" &&
      refreshedResult.token.refresh.length > 0,
  );

  TestValidator.notEquals(
    "access token must differ after refresh",
    refreshedResult.token.access,
    initialAccessToken,
  );
  TestValidator.notEquals(
    "refresh token must differ after refresh",
    refreshedResult.token.refresh,
    initialRefreshToken,
  );

  // Step 5: Error scenario - invalid refresh token
  await TestValidator.error(
    "refresh with invalid token must fail",
    async () => {
      await api.functional.auth.user.refresh(connection, {
        body: {
          refreshToken: "invalid-token",
        } satisfies ITodoListAppUser.IRefresh,
      });
    },
  );
}
