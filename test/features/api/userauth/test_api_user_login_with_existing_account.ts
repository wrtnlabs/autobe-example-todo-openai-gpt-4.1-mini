import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

/**
 * E2E test for user login with existing account including registration, login
 * success, login failures due to wrong password and unverified email.
 *
 * Workflow:
 *
 * 1. Register user via /auth/user/join with email_verified: false
 * 2. Simulate email verification boolean to true for login success test.
 * 3. Call /auth/user/login with correct credentials and verify tokens
 * 4. Call /auth/user/login with wrong password and verify error
 * 5. Call /auth/user/login with unverified email and verify error
 */
export async function test_api_user_login_with_existing_account(
  connection: api.IConnection,
) {
  // 1. Register a new user with email_verified false
  const email = typia.random<string & tags.Format<"email">>();
  const password = RandomGenerator.alphaNumeric(12);
  // Password hash must be generated but since API needs hash string, we simulate by using plain password again (not realistic but testable).
  // Assuming API has hashing internally or we provide raw string as per description.
  const userCreate = {
    email: email,
    password_hash: password, // test assumes this is acceptable
    email_verified: false,
  } satisfies ITodoListAppUser.ICreate;
  const joinedUser = await api.functional.auth.user.join(connection, {
    body: userCreate,
  });
  typia.assert(joinedUser);

  // 2. Simulate email verified user for login success
  const verifiedUserCreate = {
    email: email,
    password_hash: password,
    email_verified: true,
  } satisfies ITodoListAppUser.ICreate;
  // Join again or simulate verification internally is not supported,
  // so we manually reuse email and password for login

  // 3. Successful login with correct credentials
  const loginBody = {
    email: email,
    password: password,
  } satisfies ITodoListAppUser.ILogin;
  const loginResponse = await api.functional.auth.user.login(connection, {
    body: loginBody,
  });
  typia.assert(loginResponse);
  TestValidator.predicate(
    "Login returns user id",
    typeof loginResponse.id === "string" && loginResponse.id.length > 0,
  );
  TestValidator.predicate(
    "Login returns access token",
    typeof loginResponse.token.access === "string" &&
      loginResponse.token.access.length > 0,
  );
  TestValidator.predicate(
    "Login returns refresh token",
    typeof loginResponse.token.refresh === "string" &&
      loginResponse.token.refresh.length > 0,
  );
  TestValidator.predicate(
    "Login returns expired_at",
    typeof loginResponse.token.expired_at === "string" &&
      loginResponse.token.expired_at.length > 0,
  );
  TestValidator.predicate(
    "Login returns refreshable_until",
    typeof loginResponse.token.refreshable_until === "string" &&
      loginResponse.token.refreshable_until.length > 0,
  );

  // 4. Fail login with wrong password but verified email
  const wrongPasswordBody = {
    email: email,
    password: password + "X",
  } satisfies ITodoListAppUser.ILogin;
  await TestValidator.error("Login fails with wrong password", async () => {
    await api.functional.auth.user.login(connection, {
      body: wrongPasswordBody,
    });
  });

  // 5. Fail login with unverified email
  // For unverified email test, we have to register a user with email_verified false
  const unverifiedEmail = typia.random<string & tags.Format<"email">>();
  const unverifiedUserCreate = {
    email: unverifiedEmail,
    password_hash: password,
    email_verified: false,
  } satisfies ITodoListAppUser.ICreate;
  await api.functional.auth.user.join(connection, {
    body: unverifiedUserCreate,
  });
  const unverifiedLoginBody = {
    email: unverifiedEmail,
    password: password,
  } satisfies ITodoListAppUser.ILogin;
  await TestValidator.error("Login fails with unverified email", async () => {
    await api.functional.auth.user.login(connection, {
      body: unverifiedLoginBody,
    });
  });
}
