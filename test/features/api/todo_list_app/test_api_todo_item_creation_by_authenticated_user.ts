import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

/**
 * Test the creation of a new todo item for an authenticated user.
 *
 * This test covers:
 *
 * 1. User registration with valid email, password_hash, and email_verified set to
 *    true.
 * 2. Creation of a todo item with a valid non-empty description and status
 *    "pending".
 * 3. Verification that the response includes expected fields with correct types
 *    and values.
 * 4. Business logic validation ensuring data integrity and consistency.
 */
export async function test_api_todo_item_creation_by_authenticated_user(
  connection: api.IConnection,
) {
  // 1. Register a new user to get an authenticated context
  const userBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    email_verified: true,
  } satisfies ITodoListAppUser.ICreate;

  const authorizedUser: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userBody,
    });
  typia.assert(authorizedUser);

  // 2. Create a new todo item with valid description and status 'pending'
  const todoItemBody = {
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 8,
    }),
    status: "pending",
    todo_list_app_user_id: authorizedUser.id,
  } satisfies ITodoListAppTodoItem.ICreate;

  const todoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        body: todoItemBody,
      },
    );

  // 3. Assert the returned todo item
  typia.assert(todoItem);

  // 4. Business logic checks
  TestValidator.equals(
    "todo item user id matches authenticated user",
    todoItem.todo_list_app_user_id,
    authorizedUser.id,
  );
  TestValidator.predicate(
    "todo item description is a non-empty string",
    todoItem.description.length > 0,
  );
  TestValidator.equals(
    "todo item status is 'pending'",
    todoItem.status,
    "pending",
  );

  // Validate date format for created_at and updated_at
  TestValidator.predicate(
    "todo item created_at is valid ISO 8601 date",
    typeof todoItem.created_at === "string" &&
      !isNaN(Date.parse(todoItem.created_at)),
  );
  TestValidator.predicate(
    "todo item updated_at is valid ISO 8601 date",
    typeof todoItem.updated_at === "string" &&
      !isNaN(Date.parse(todoItem.updated_at)),
  );
}
