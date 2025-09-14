import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

export async function test_api_admin_login_success(
  connection: api.IConnection,
) {
  // Prepare admin account creation data
  const email = typia.random<string & tags.Format<"email">>();
  const password = RandomGenerator.alphaNumeric(12);

  // 1. Create admin user account using join endpoint
  const createdAdmin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: email,
        password: password,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(createdAdmin);

  // 2. Attempt login with the same credentials
  const loggedInAdmin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: {
        email: email,
        password: password,
      } satisfies ITodoListAdmin.ILogin,
    });
  typia.assert(loggedInAdmin);

  // Validate that the logged in admin id matches the created admin id
  TestValidator.equals(
    "login admin id matches created admin id",
    loggedInAdmin.id,
    createdAdmin.id,
  );
  // Validate that access token strings are equal
  TestValidator.equals(
    "access token matches after login",
    loggedInAdmin.token.access,
    createdAdmin.token.access,
  );
  // Validate that refresh token strings are equal
  TestValidator.equals(
    "refresh token matches after login",
    loggedInAdmin.token.refresh,
    createdAdmin.token.refresh,
  );
  // Validate that expiration dates are non-empty strings with date-time format
  TestValidator.predicate(
    "access token expiration is non-empty string",
    typeof loggedInAdmin.token.expired_at === "string" &&
      loggedInAdmin.token.expired_at.length > 0,
  );
  TestValidator.predicate(
    "refresh token validity is non-empty string",
    typeof loggedInAdmin.token.refreshable_until === "string" &&
      loggedInAdmin.token.refreshable_until.length > 0,
  );
}
