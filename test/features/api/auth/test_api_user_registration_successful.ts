import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_user_registration_successful(
  connection: api.IConnection,
) {
  // Generate a realistic email address
  const email = `user_${RandomGenerator.alphaNumeric(8)}@example.com`;

  // Simulate a password hash string (dummy hashed password format)
  const passwordHash = RandomGenerator.alphaNumeric(64); // 64 char alphanumeric

  // Create the user registration data
  const userCreateBody = {
    email: email as string & tags.Format<"email">,
    password_hash: passwordHash,
    email_verified: false,
  } satisfies ITodoListAppUser.ICreate;

  // Call the join API to register the user
  const authorizedUser: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userCreateBody,
    });
  // Assert the API response type correctness including UUID and token
  typia.assert(authorizedUser);

  // Validate that user ID is a UUID string
  TestValidator.predicate(
    "user ID must be UUID format",
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      authorizedUser.id,
    ),
  );

  // Basic checks on authorization token properties
  TestValidator.predicate(
    "authorization token access is non-empty string",
    typeof authorizedUser.token.access === "string" &&
      authorizedUser.token.access.length > 0,
  );

  TestValidator.predicate(
    "authorization token refresh is non-empty string",
    typeof authorizedUser.token.refresh === "string" &&
      authorizedUser.token.refresh.length > 0,
  );

  TestValidator.predicate(
    "authorization token expired_at is ISO date-time string",
    !isNaN(Date.parse(authorizedUser.token.expired_at)) &&
      typeof authorizedUser.token.expired_at === "string",
  );

  TestValidator.predicate(
    "authorization token refreshable_until is ISO date-time string",
    !isNaN(Date.parse(authorizedUser.token.refreshable_until)) &&
      typeof authorizedUser.token.refreshable_until === "string",
  );
}
