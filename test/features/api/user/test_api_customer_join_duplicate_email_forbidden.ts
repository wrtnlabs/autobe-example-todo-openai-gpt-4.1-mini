import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Tests the system's response when attempting to register a new user with an
 * email address that is already in use.
 *
 * This test performs the following steps:
 *
 * 1. Registers a new user with a unique email address and a generated password.
 * 2. Attempts to register another user with the same email address, expecting the
 *    operation to fail due to duplicate email restriction.
 *
 * The test verifies that the initial registration succeeds and returns the
 * expected authorized user data, and that the duplicate registration is
 * rejected with an error, validating the backend's enforcement of unique email
 * addresses.
 *
 * @param connection The API connection to use for all requests.
 */
export async function test_api_customer_join_duplicate_email_forbidden(
  connection: api.IConnection,
) {
  // 1. Create initial user to establish account and authorization
  const email: string = typia.random<string & tags.Format<"email">>();
  const password: string = RandomGenerator.alphaNumeric(16);
  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    {
      body: {
        email: email,
        password: password,
      } satisfies ITodoListUser.ICreate,
    },
  );
  typia.assert(user);

  // 2. Attempt to create duplicate user with same email - expect failure
  await TestValidator.error("duplicate email should be rejected", async () => {
    await api.functional.auth.user.join(connection, {
      body: {
        email: email, // duplicate email
        password: RandomGenerator.alphaNumeric(16),
      } satisfies ITodoListUser.ICreate,
    });
  });
}
