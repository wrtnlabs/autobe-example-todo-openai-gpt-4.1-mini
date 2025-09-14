import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test validates successful retrieval of a todo item for an
 * authenticated user. It creates a user account via the join API, then
 * assumes a todo item belonging to that user exists (creating it implicitly
 * via simulation). It then fetches the todo details by todoId and validates
 * correctness and ownership.
 *
 * Steps:
 *
 * 1. User creation & authentication
 * 2. Simulated todo creation with realistic random data
 * 3. Fetch todo details via GET /todoList/user/todos/{todoId}
 * 4. Assert returned data matches expected structure and user ownership
 */
export async function test_api_todo_list_user_todo_detail_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate user
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "validPassword123",
  } satisfies ITodoListUser.ICreate;

  const authorizedUser = await api.functional.auth.user.join(connection, {
    body: userCreateBody,
  });
  typia.assert(authorizedUser);

  // 2. Simulate creation of todo item
  const todoItem = {
    id: typia.random<string & tags.Format<"uuid">>(),
    todo_list_user_id: authorizedUser.id,
    title: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    description: RandomGenerator.paragraph({
      sentences: 10,
      wordMin: 5,
      wordMax: 15,
    }),
    status: typia.random<"pending" | "in-progress" | "completed">(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  } satisfies ITodoListTodo;

  // 3. Fetching todo details via API
  const fetchedTodo: ITodoListTodo =
    await api.functional.todoList.user.todos.at(connection, {
      todoId: todoItem.id,
    });

  typia.assert(fetchedTodo);

  // 4. Validate fetched todo
  TestValidator.equals("todo id matches", fetchedTodo.id, todoItem.id);
  TestValidator.equals(
    "todo ownership matches user id",
    fetchedTodo.todo_list_user_id,
    authorizedUser.id,
  );

  TestValidator.predicate(
    "todo status is valid enum",
    ["pending", "in-progress", "completed"].includes(fetchedTodo.status),
  );

  TestValidator.predicate(
    "todo title is non-empty string",
    typeof fetchedTodo.title === "string" && fetchedTodo.title.length > 0,
  );

  // description may be null or string
  TestValidator.predicate(
    "todo description is string or null",
    fetchedTodo.description === null ||
      typeof fetchedTodo.description === "string",
  );

  // Validate created_at and updated_at are ISO datetime strings
  TestValidator.predicate(
    "created_at is date-time format",
    typeof fetchedTodo.created_at === "string" &&
      !isNaN(Date.parse(fetchedTodo.created_at)),
  );
  TestValidator.predicate(
    "updated_at is date-time format",
    typeof fetchedTodo.updated_at === "string" &&
      !isNaN(Date.parse(fetchedTodo.updated_at)),
  );

  // deleted_at may be null or date-time string or undefined
  TestValidator.predicate(
    "deleted_at is null or date-time or undefined",
    fetchedTodo.deleted_at === null ||
      fetchedTodo.deleted_at === undefined ||
      (typeof fetchedTodo.deleted_at === "string" &&
        !isNaN(Date.parse(fetchedTodo.deleted_at))),
  );
}
