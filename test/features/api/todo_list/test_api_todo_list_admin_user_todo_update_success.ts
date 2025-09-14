import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

export async function test_api_todo_list_admin_user_todo_update_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "1234";
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // Step 2: Prepare update data for the todo item
  const updateData = {
    title: RandomGenerator.paragraph({ sentences: 3, wordMin: 3, wordMax: 7 }),
    description: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 5,
      sentenceMax: 8,
      wordMin: 4,
      wordMax: 8,
    }),
    status: typia.random<"pending" | "in-progress" | "completed">(),
  } satisfies ITodoListTodos.IUpdate;

  // Step 3: Generate required path parameters
  const userId = typia.random<string & tags.Format<"uuid">>();
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // Step 4: Perform the update operation
  const updatedTodo: ITodoListTodos =
    await api.functional.todoList.admin.users.todos.update(connection, {
      userId: userId,
      todoId: todoId,
      body: updateData,
    });
  typia.assert(updatedTodo);

  // Step 5: Validate that the response's updated fields match the update request
  TestValidator.equals(
    "updated title matches",
    updatedTodo.title,
    updateData.title ?? updatedTodo.title,
  );
  TestValidator.equals(
    "updated description matches",
    updatedTodo.description ?? null,
    updateData.description ?? null,
  );
  TestValidator.equals(
    "updated status matches",
    updatedTodo.status,
    updateData.status ?? updatedTodo.status,
  );
  TestValidator.predicate(
    "valid uuid format for todo id",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      updatedTodo.id,
    ),
  );
  TestValidator.predicate(
    "valid uuid format for todo_list_user_id",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      updatedTodo.todo_list_user_id,
    ),
  );
  TestValidator.predicate(
    "valid status enum",
    ["pending", "in-progress", "completed"].includes(updatedTodo.status),
  );
  TestValidator.predicate(
    "created_at is ISO datetime",
    typeof updatedTodo.created_at === "string" &&
      !isNaN(Date.parse(updatedTodo.created_at)),
  );
  TestValidator.predicate(
    "updated_at is ISO datetime",
    typeof updatedTodo.updated_at === "string" &&
      !isNaN(Date.parse(updatedTodo.updated_at)),
  );
  if (updatedTodo.deleted_at !== null && updatedTodo.deleted_at !== undefined) {
    TestValidator.predicate(
      "deleted_at is ISO datetime if present",
      typeof updatedTodo.deleted_at === "string" &&
        !isNaN(Date.parse(updatedTodo.deleted_at)),
    );
  }
}
