import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

export async function test_api_todo_admin_update_user_todo_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user via join
  const localPart = RandomGenerator.alphaNumeric(10);
  const adminEmail = `admin${localPart}@example.com`;
  const adminCreateBody = {
    email: adminEmail,
    password: "securePassword123",
  } satisfies ITodoListAdmin.ICreate;
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Login as the admin user
  const adminLoginBody = {
    email: adminCreateBody.email,
    password: adminCreateBody.password,
  } satisfies ITodoListAdmin.ILogin;
  const adminLoginAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLoginAuthorized);

  // 3. Simulate existing userId and todoId (UUID format)
  const userId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const todoId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Prepare todo update data with valid fields respecting unique title and enum status
  const updateBody = {
    title: RandomGenerator.paragraph({ sentences: 3, wordMin: 3, wordMax: 9 }),
    description: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 3,
      sentenceMax: 6,
      wordMin: 5,
      wordMax: 10,
    }),
    status: RandomGenerator.pick([
      "pending",
      "in-progress",
      "completed",
    ] as const),
  } satisfies ITodoListTodos.IUpdate;

  // 5. Call the update endpoint and validate the returned todo item
  const updatedTodo: ITodoListTodos =
    await api.functional.todoList.admin.users.todos.update(connection, {
      userId,
      todoId,
      body: updateBody,
    });
  typia.assert(updatedTodo);

  // 6. Verify the returned updated todo fields match the request (where applicable)
  TestValidator.equals(
    "updated todo title",
    updatedTodo.title,
    updateBody.title,
  );
  TestValidator.equals(
    "updated todo description",
    updatedTodo.description ?? null,
    updateBody.description ?? null,
  );
  TestValidator.equals(
    "updated todo status",
    updatedTodo.status,
    updateBody.status,
  );
  TestValidator.equals("userId matches", updatedTodo.todo_list_user_id, userId);
  TestValidator.equals("todoId matches", updatedTodo.id, todoId);
}
