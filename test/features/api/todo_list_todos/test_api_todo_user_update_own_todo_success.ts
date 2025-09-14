import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test Scenario: Successful update of user's own todo item
 *
 * 1. Create a new user via POST /auth/user/join with random valid email and
 *    password.
 * 2. Login as the created user with POST /auth/user/login.
 * 3. Create an initial todo item for the user directly using update API's
 *    response for testing (since creation API is not provided, simulate a
 *    todo id and create via update afterwards).
 * 4. Update the todo item with valid values for title, description, and
 *    status.
 *
 *    - Title: unique string within 100 characters
 *    - Description: optional, max 500 characters
 *    - Status: one of allowed enum values
 * 5. Assert that the response matches the updated values and the todo id and
 *    userId remain unchanged.
 * 6. Confirm strict typing and correct business rules applied by API.
 */

export async function test_api_todo_user_update_own_todo_success(
  connection: api.IConnection,
) {
  // 1. Create new user
  const createUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
  } satisfies ITodoListUser.ICreate;
  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    { body: createUserBody },
  );
  typia.assert(user);

  // 2. Login as the created user
  const loginBody = {
    email: createUserBody.email,
    password: createUserBody.password,
  } satisfies ITodoListUser.ILogin;
  const loginUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.login(connection, { body: loginBody });
  typia.assert(loginUser);

  // 3. Create initial todo item by leveraging update endpoint since no create exists
  // Generate a random UUID for todoId
  const todoId = typia.random<string & tags.Format<"uuid">>();

  const initialTodo = await api.functional.todoList.user.users.todos.update(
    connection,
    {
      userId: user.id,
      todoId,
      body: {
        title: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 3,
          wordMax: 7,
        }).substring(0, 100),
        description: RandomGenerator.content({
          paragraphs: 1,
          sentenceMin: 5,
          sentenceMax: 10,
          wordMin: 3,
          wordMax: 7,
        }).substring(0, 500),
        status: "pending",
      } satisfies ITodoListTodos.IUpdate,
    },
  );
  typia.assert(initialTodo);
  TestValidator.equals("initial todo id unchanged", initialTodo.id, todoId);
  TestValidator.equals(
    "initial todo userId matches user",
    initialTodo.todo_list_user_id,
    user.id,
  );

  // 4. Update todo item with new valid data
  const updateBody = {
    title: RandomGenerator.paragraph({
      sentences: 2,
      wordMin: 4,
      wordMax: 8,
    }).substring(0, 100),
    description: RandomGenerator.content({
      paragraphs: 2,
      sentenceMin: 6,
      sentenceMax: 12,
      wordMin: 4,
      wordMax: 8,
    }).substring(0, 500),
    status: RandomGenerator.pick([
      "pending",
      "in-progress",
      "completed",
    ] as const),
  } satisfies ITodoListTodos.IUpdate;

  const updatedTodo = await api.functional.todoList.user.users.todos.update(
    connection,
    {
      userId: user.id,
      todoId,
      body: updateBody,
    },
  );
  typia.assert(updatedTodo);

  // 5. Validate updated fields
  TestValidator.equals(
    "updated todo id should be same",
    updatedTodo.id,
    todoId,
  );
  TestValidator.equals(
    "updated todo userId should be same",
    updatedTodo.todo_list_user_id,
    user.id,
  );
  TestValidator.equals(
    "updated todo title should match",
    updatedTodo.title,
    updateBody.title,
  );

  if (updateBody.description === null) {
    TestValidator.equals(
      "updated todo description should be null",
      updatedTodo.description,
      null,
    );
  } else if (updateBody.description === undefined) {
    TestValidator.predicate(
      "updated todo description value is defined",
      updatedTodo.description !== undefined,
    );
  } else {
    TestValidator.equals(
      "updated todo description should match",
      updatedTodo.description,
      updateBody.description,
    );
  }

  TestValidator.equals(
    "updated todo status should match",
    updatedTodo.status,
    updateBody.status,
  );
}
