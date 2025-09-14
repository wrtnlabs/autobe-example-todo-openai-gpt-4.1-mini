import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Validate the full login workflow for a 'user' role account.
 *
 * This test covers the following main steps:
 *
 * 1. User registration via the join endpoint with valid email and password.
 * 2. User login using the same credentials.
 * 3. Verification of authentication tokens and user identity consistency.
 *
 * The test ensures that newly registered users can successfully log in,
 * receiving proper JWT tokens enabling authenticated access to the system.
 * It validates the integrity between registration and login operations, and
 * the correct issuance of authorization tokens.
 */
export async function test_api_customer_login_success(
  connection: api.IConnection,
) {
  // 1. User registration
  const email: string = `${RandomGenerator.alphaNumeric(6)}@example.com`;
  const password: string = RandomGenerator.alphaNumeric(12);
  const joinBody = {
    email,
    password,
  } satisfies ITodoListUser.ICreate;

  const joinResponse: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, { body: joinBody });
  typia.assert(joinResponse);
  TestValidator.equals(
    "registered email matches input",
    joinResponse.email,
    email,
  );

  // 2. User login
  const loginBody = {
    email,
    password,
  } satisfies ITodoListUser.ILogin;

  const loginResponse: ITodoListUser.IAuthorized =
    await api.functional.auth.user.login(connection, { body: loginBody });
  typia.assert(loginResponse);

  // 3. Verify tokens exist and user IDs match
  TestValidator.predicate(
    "login response has token.access",
    typeof loginResponse.token.access === "string" &&
      loginResponse.token.access.length > 0,
  );
  TestValidator.predicate(
    "login response has token.refresh",
    typeof loginResponse.token.refresh === "string" &&
      loginResponse.token.refresh.length > 0,
  );
  TestValidator.equals(
    "login response user ID matches join response user ID",
    loginResponse.id,
    joinResponse.id,
  );
  TestValidator.equals(
    "login response email matches join response email",
    loginResponse.email,
    joinResponse.email,
  );
  TestValidator.predicate(
    "token.access expiration is a valid ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
      loginResponse.token.expired_at,
    ),
  );
  TestValidator.predicate(
    "token.refreshable_until is a valid ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
      loginResponse.token.refreshable_until,
    ),
  );
}
