import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test validates the retrieval of a todoListUser's details by userId.
 *
 * Scenario steps:
 *
 * 1. Create a new admin user and acquire authorization tokens.
 * 2. Retrieve the created admin user's details via GET with the admin userId.
 * 3. Attempt to retrieve details for non-existent userId, expect failure.
 * 4. Attempt to retrieve user details with no authentication, expect failure.
 *
 * This validates both successful data retrieval and proper error handling
 * for access control and resource availability.
 */
export async function test_api_todo_list_user_at_success_and_not_found_and_auth_error(
  connection: api.IConnection,
) {
  // Step 1: Join admin user and authenticate
  const requestBody = {
    email: RandomGenerator.alphaNumeric(8) + "@example.com",
    password: "complexPassword123!",
  } satisfies ITodoListAdmin.ICreate;

  // Create admin and get authorized info
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: requestBody,
    });
  typia.assert(adminAuthorized);

  // Step 2: Retrieve the todo list user details of the created admin
  const userId: string & tags.Format<"uuid"> = adminAuthorized.id;
  const todoListUser: ITodoListUser =
    await api.functional.todoList.admin.users.at(connection, { userId });
  typia.assert(todoListUser);

  TestValidator.equals(
    "retrieved userId matches admin id",
    todoListUser.id,
    adminAuthorized.id,
  );
  TestValidator.equals(
    "retrieved user email matches admin email",
    todoListUser.email,
    requestBody.email,
  );

  // Step 3: Attempt to retrieve non-existent user by random UUID
  let nonExistentUserId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  while (nonExistentUserId === userId) {
    // Regenerate if by chance same as existing
    nonExistentUserId = typia.random<string & tags.Format<"uuid">>();
  }

  await TestValidator.error(
    "retrieving non-existent user should fail",
    async () => {
      await api.functional.todoList.admin.users.at(connection, {
        userId: nonExistentUserId,
      });
    },
  );

  // Step 4: Attempt to retrieve user details with unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthenticated user retrieval should fail",
    async () => {
      await api.functional.todoList.admin.users.at(unauthConn, { userId });
    },
  );
}
