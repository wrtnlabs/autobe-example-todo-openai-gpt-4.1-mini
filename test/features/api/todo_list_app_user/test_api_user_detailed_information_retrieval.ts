import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoListAppUsers";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_user_detailed_information_retrieval(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a new user
  const userCreateBody = {
    email: `${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(20),
    email_verified: false,
  } satisfies ITodoListAppUser.ICreate;

  const authorizedUser = await api.functional.auth.user.join(connection, {
    body: userCreateBody,
  });
  typia.assert(authorizedUser);

  // 2. Create a todo item for the user as prerequisite
  const todoCreateBody = {
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 3,
      wordMax: 10,
    }),
    status: "pending",
    todo_list_app_user_id: authorizedUser.id,
  } satisfies ITodoListAppTodoItem.ICreate;

  const todoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        body: todoCreateBody,
      },
    );
  typia.assert(todoItem);

  // 3. Retrieve the user information by ID
  const retrievedUser =
    await api.functional.todoListApp.user.todoListAppUsers.at(connection, {
      id: authorizedUser.id,
    });
  typia.assert(retrievedUser);

  // Validate returned fields
  TestValidator.equals(
    "retrieved user email",
    retrievedUser.email,
    userCreateBody.email,
  );
  TestValidator.equals(
    "retrieved user email_verified flag",
    retrievedUser.email_verified,
    userCreateBody.email_verified,
  );

  // Check created_at and updated_at are strings with date-time format
  TestValidator.predicate(
    "created_at is a valid ISO 8601 date",
    typeof retrievedUser.created_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
        retrievedUser.created_at,
      ),
  );
  TestValidator.predicate(
    "updated_at is a valid ISO 8601 date",
    typeof retrievedUser.updated_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
        retrievedUser.updated_at,
      ),
  );

  // Ensure password_hash is not included in retrieved user
  TestValidator.predicate(
    "password_hash is not present in retrieved user",
    !("password_hash" in retrievedUser),
  );

  // 4. Test unauthorized access is rejected
  // To simulate unauthorized, use a new connection without auth token
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized access rejected", async () => {
    await api.functional.todoListApp.user.todoListAppUsers.at(
      unauthorizedConnection,
      { id: authorizedUser.id },
    );
  });

  // 5. Test retrieval of non-existent user returns error
  await TestValidator.error(
    "retrieval of non-existent user fails",
    async () => {
      await api.functional.todoListApp.user.todoListAppUsers.at(connection, {
        id: typia.random<string & tags.Format<"uuid">>(),
      });
    },
  );
}
