import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

export async function test_api_todo_list_user_todo_update_success(
  connection: api.IConnection,
) {
  // 1. Create user and authenticate
  const email = `user_${RandomGenerator.alphaNumeric(8)}@example.com`;
  const password = "Password123!";
  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    {
      body: {
        email,
        password,
      } satisfies ITodoListUser.ICreate,
    },
  );
  typia.assert(user);

  // 2. Generate a new todo id
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 3. Create initial todo via update endpoint (simulating creation, as no create endpoint is provided)
  // Note: Limit title to maximum 100 characters as per schema
  const initialTitle = RandomGenerator.paragraph({
    sentences: 10,
    wordMin: 1,
    wordMax: 10,
  }).slice(0, 100);
  const initialDescription = RandomGenerator.paragraph({ sentences: 5 });
  const initialStatus = RandomGenerator.pick([
    "pending",
    "in-progress",
    "completed",
  ] as const);

  const createBody = {
    title: initialTitle,
    description: initialDescription,
    status: initialStatus,
  } satisfies ITodoListTodo.IUpdate;

  const createdTodo: ITodoListTodo =
    await api.functional.todoList.user.todos.update(connection, {
      todoId,
      body: createBody,
    });
  typia.assert(createdTodo);

  // Validate that the created todo contains the expected values
  TestValidator.equals(
    "created todo title matches",
    createdTodo.title,
    initialTitle,
  );
  TestValidator.equals(
    "created todo description matches",
    createdTodo.description,
    initialDescription,
  );
  TestValidator.equals(
    "created todo status matches",
    createdTodo.status,
    initialStatus,
  );
  TestValidator.equals("created todo id matches", createdTodo.id, todoId);
  typia.assert<string & tags.Format<"uuid">>(createdTodo.todo_list_user_id);

  // 4. Update the todo with new values
  const updatedTitleRaw = RandomGenerator.paragraph({
    sentences: 10,
    wordMin: 1,
    wordMax: 10,
  });
  // Limit updatedTitle to max 100 characters
  const updatedTitle = updatedTitleRaw.slice(0, 100);
  const updatedDescription = null; // Testing nullable description by setting it explicitly to null
  const updatedStatus = RandomGenerator.pick([
    "pending",
    "in-progress",
    "completed",
  ] as const);

  const updateBody = {
    title: updatedTitle,
    description: updatedDescription,
    status: updatedStatus,
  } satisfies ITodoListTodo.IUpdate;

  const updatedTodo: ITodoListTodo =
    await api.functional.todoList.user.todos.update(connection, {
      todoId,
      body: updateBody,
    });
  typia.assert(updatedTodo);

  // Validate updated todo values
  TestValidator.equals(
    "updated todo title matches",
    updatedTodo.title,
    updatedTitle,
  );
  TestValidator.equals(
    "updated todo description matches",
    updatedTodo.description,
    updatedDescription,
  );
  TestValidator.equals(
    "updated todo status matches",
    updatedTodo.status,
    updatedStatus,
  );
  TestValidator.equals("updated todo id matches", updatedTodo.id, todoId);
  typia.assert<string & tags.Format<"uuid">>(updatedTodo.todo_list_user_id);
}
