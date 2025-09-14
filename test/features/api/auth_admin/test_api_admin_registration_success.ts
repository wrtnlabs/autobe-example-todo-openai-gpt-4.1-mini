import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";

/**
 * Test administrator account registration with valid email and password via
 * /auth/admin/join endpoint.
 *
 * The scenario simulates creating a new admin user which returns authorization
 * tokens upon success.
 *
 * Ensures that registration properly creates admin accounts with required
 * credentials and issues JWT tokens for authentication.
 *
 * Successful outcome includes receiving valid JWT tokens and admin identifier
 * in response.
 */
export async function test_api_admin_registration_success(
  connection: api.IConnection,
) {
  // Prepare admin registration data
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = RandomGenerator.alphaNumeric(12); // typical password length

  // Call the admin join API to register
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });

  // Validate the output type and structure
  typia.assert(adminAuthorized);

  // Ensure the admin ID is a valid UUID
  TestValidator.predicate(
    "admin id is valid UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      adminAuthorized.id,
    ),
  );

  // Ensure JWT token properties are valid strings
  TestValidator.predicate(
    "token access is non-empty string",
    typeof adminAuthorized.token.access === "string" &&
      adminAuthorized.token.access.length > 0,
  );
  TestValidator.predicate(
    "token refresh is non-empty string",
    typeof adminAuthorized.token.refresh === "string" &&
      adminAuthorized.token.refresh.length > 0,
  );

  // Validate date-time format for token expiration times
  TestValidator.predicate(
    "token expired_at is valid ISO date-time",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(
      adminAuthorized.token.expired_at,
    ),
  );
  TestValidator.predicate(
    "token refreshable_until is valid ISO date-time",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(
      adminAuthorized.token.refreshable_until,
    ),
  );
}
