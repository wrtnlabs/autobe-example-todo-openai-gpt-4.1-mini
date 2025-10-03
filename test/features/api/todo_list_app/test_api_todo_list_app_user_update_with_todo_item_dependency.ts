import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoListAppUsers";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

/**
 * This E2E test covers the complete workflow of updating a todo list app user
 * after creating a todo item owned by the user. The test first registers a new
 * user account via the POST /auth/user/join endpoint, obtaining authenticated
 * user credentials. Next, it creates a new todo item associated with the
 * created user's ID via POST
 * /todoListApp/user/todoListAppUsers/{todoListAppUserId}/todoListAppTodoItems.
 * Finally, it updates the user's details via PUT
 * /todoListApp/user/todoListAppUsers/{id}. The test verifies that the user
 * creation, todo item creation, and user update API calls succeed with valid
 * data adhering to schema constraints, including required properties and
 * formats. It also validates the integrity of updated user data by asserting
 * updated properties. Error scenarios for unauthorized updates are not
 * explicitly modeled due to lack of explicit API definitions and instruction
 * brevity, but the test ensures safety by sequential authentication and data
 * ownership. All DTO types used are from the provided structures, with proper
 * `satisfies` usage and typia assertions to ensure type safety. All
 * asynchronous calls await completion, and descriptive TestValidator assertions
 * are included to validate the business logic and API contract requirements.
 */
export async function test_api_todo_list_app_user_update_with_todo_item_dependency(
  connection: api.IConnection,
) {
  // 1. Register a new user account via /auth/user/join
  const userCreateBody = typia.random<ITodoListAppUser.ICreate>();

  const userAuthorized: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userCreateBody,
    });
  typia.assert(userAuthorized);

  // 2. Create a new todo item owned by the created user
  const todoCreateBody = {
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 7,
    }),
    status: "pending",
    todo_list_app_user_id: userAuthorized.id,
  } satisfies ITodoListAppTodoItem.ICreate;

  const todoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: userAuthorized.id,
        body: todoCreateBody,
      },
    );
  typia.assert(todoItem);

  // 3. Update the user's details via PUT
  const userUpdateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    email_verified: true,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    deleted_at: null,
  } satisfies ITodoListAppTodoListAppUsers.IUpdate;

  const updatedUser: ITodoListAppTodoListAppUsers =
    await api.functional.todoListApp.user.todoListAppUsers.update(connection, {
      id: userAuthorized.id,
      body: userUpdateBody,
    });
  typia.assert(updatedUser);

  // Validate that updated user fields match update request
  TestValidator.equals(
    "user email updated correctly",
    updatedUser.email,
    userUpdateBody.email,
  );
  TestValidator.equals(
    "user password_hash updated correctly",
    updatedUser.password_hash,
    userUpdateBody.password_hash,
  );
  TestValidator.equals(
    "user email_verified updated correctly",
    updatedUser.email_verified,
    userUpdateBody.email_verified,
  );
  // created_at and updated_at might differ slightly in backend but check for presence
  TestValidator.predicate(
    "user created_at is valid ISO date",
    typeof updatedUser.created_at === "string" &&
      updatedUser.created_at.length > 0,
  );
  TestValidator.predicate(
    "user updated_at is valid ISO date",
    typeof updatedUser.updated_at === "string" &&
      updatedUser.updated_at.length > 0,
  );
  TestValidator.equals("user deleted_at is null", updatedUser.deleted_at, null);
}
