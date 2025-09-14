import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Validate that a user can update their specific todo item successfully.
 *
 * The workflow includes:
 *
 * 1. User registration and authorization via POST /auth/user/join.
 * 2. Creating an initial todo item (simulated by generating a UUID as todoId).
 * 3. Updating the todo item with new title, description, and status.
 * 4. Validating the response todo item matches update input and respects
 *    business rules:
 *
 *    - Title uniqueness per user.
 *    - Status is one of "pending", "in-progress", "completed".
 * 5. Ensuring typia.assert validates response shape.
 *
 * The test uses typia.random and RandomGenerator utilities to generate
 * realistic test data.
 */
export async function test_api_todo_list_user_user_todo_update_success(
  connection: api.IConnection,
) {
  // 1. Register a new user
  const userCreateBody = {
    email: `${RandomGenerator.alphaNumeric(6)}@example.com`,
    password: "Password123!",
  } satisfies ITodoListUser.ICreate;

  const authorizedUser = await api.functional.auth.user.join(connection, {
    body: userCreateBody,
  });
  typia.assert(authorizedUser);

  // 2. Generate a valid todoId UUID to simulate existing todo
  const todoId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Prepare updated todo data
  const updatedTodoBody = {
    title: "Updated Unique Title",
    description: "Updated description with more details.",
    status: "in-progress" as const,
  } satisfies ITodoListTodos.IUpdate;

  // 4. Call update API
  const updatedTodo = await api.functional.todoList.user.users.todos.update(
    connection,
    {
      userId: authorizedUser.id,
      todoId: todoId,
      body: updatedTodoBody,
    },
  );
  typia.assert(updatedTodo);

  // 5. Validate response fields
  TestValidator.equals(
    "todo user ID matches",
    updatedTodo.todo_list_user_id,
    authorizedUser.id,
  );
  TestValidator.equals("todo ID matches", updatedTodo.id, todoId);
  TestValidator.equals(
    "todo title updated",
    updatedTodo.title,
    updatedTodoBody.title,
  );
  TestValidator.equals(
    "todo description updated",
    updatedTodo.description,
    updatedTodoBody.description,
  );
  TestValidator.equals(
    "todo status updated",
    updatedTodo.status,
    updatedTodoBody.status,
  );

  // 6. Validate status enum
  TestValidator.predicate(
    "todo status valid enum",
    ["pending", "in-progress", "completed"].includes(updatedTodo.status),
  );

  // Note: Title uniqueness per user cannot be fully tested here without creating multiple todos.
  // Ensuring the update returns the updated title confirms basic correctness.
}
