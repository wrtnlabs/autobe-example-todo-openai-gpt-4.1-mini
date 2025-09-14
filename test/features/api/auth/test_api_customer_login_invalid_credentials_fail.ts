import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

export async function test_api_customer_login_invalid_credentials_fail(
  connection: api.IConnection,
) {
  // 1. Create a new user account with valid email and password for testing invalid login
  const validUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListUser.ICreate;

  const authorizedUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, { body: validUserBody });
  typia.assert(authorizedUser);

  // 2. Attempt login with correct email but incorrect password, expect failure
  const loginFailBody = {
    email: validUserBody.email,
    password: RandomGenerator.alphaNumeric(12), // purposely wrong password
  } satisfies ITodoListUser.ILogin;

  await TestValidator.error(
    "login with invalid credentials should fail",
    async () => {
      await api.functional.auth.user.login(connection, { body: loginFailBody });
    },
  );
}
