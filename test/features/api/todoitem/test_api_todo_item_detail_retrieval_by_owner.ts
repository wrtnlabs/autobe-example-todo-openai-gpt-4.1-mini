import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_todo_item_detail_retrieval_by_owner(
  connection: api.IConnection,
) {
  // Register a new user and assert correct registration
  const userCreateBody = {
    email: `${RandomGenerator.name(1)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(16),
    email_verified: true,
  } satisfies ITodoListAppUser.ICreate;

  const authorizedUser = await api.functional.auth.user.join(connection, {
    body: userCreateBody,
  });
  typia.assert(authorizedUser);

  // Create a new todo item for the authenticated user
  const todoCreateBody = {
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 3,
      wordMax: 8,
    }),
    status: "pending",
    todo_list_app_user_id: authorizedUser.id,
  } satisfies ITodoListAppTodoItem.ICreate;

  const createdTodo =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        body: todoCreateBody,
      },
    );
  typia.assert(createdTodo);

  // Retrieve the todo item details by user and todo item IDs
  const retrievedTodo =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.at(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        id: createdTodo.id,
      },
    );
  typia.assert(retrievedTodo);

  // Validate that retrieved data matches the created todo item
  TestValidator.equals(
    "todo item ID matches",
    retrievedTodo.id,
    createdTodo.id,
  );
  TestValidator.equals(
    "todo item user ID matches",
    retrievedTodo.todo_list_app_user_id,
    authorizedUser.id,
  );
  TestValidator.equals(
    "todo item description matches",
    retrievedTodo.description,
    todoCreateBody.description,
  );
  TestValidator.equals(
    "todo item status matches",
    retrievedTodo.status,
    todoCreateBody.status,
  );
  // Validate that created_at and updated_at timestamps exist and are strings
  TestValidator.predicate(
    "todo item created_at is a non-empty string",
    typeof retrievedTodo.created_at === "string" &&
      retrievedTodo.created_at.length > 0,
  );
  TestValidator.predicate(
    "todo item updated_at is a non-empty string",
    typeof retrievedTodo.updated_at === "string" &&
      retrievedTodo.updated_at.length > 0,
  );
}
