import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

/**
 * Validates the retrieval of detailed todo information by an admin user.
 *
 * This test ensures that a newly created admin user can authenticate and
 * then access the detailed information of a specific todo item belonging to
 * a given user. It checks that the returned data fully matches the expected
 * schema and respects access permissions.
 */
export async function test_api_todo_list_admin_user_todo_detail_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Register and authenticate admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "SecurePass123!",
  } satisfies ITodoListAdmin.ICreate;

  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Use authenticated admin connection (handled internally by SDK)

  // 3. Generate userId and todoId with valid UUID format
  const userId = typia.random<string & tags.Format<"uuid">>();
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 4. Retrieve todo detail for user
  const todoDetail: ITodoListTodos =
    await api.functional.todoList.admin.users.todos.at(connection, {
      userId,
      todoId,
    });
  typia.assert(todoDetail);

  // 5. Validate returned todo fields
  TestValidator.equals(
    "todo id matches requested todoId",
    todoDetail.id,
    todoId,
  );
  TestValidator.equals(
    "todo user id matches requested userId",
    todoDetail.todo_list_user_id,
    userId,
  );
  TestValidator.predicate(
    "todo title is non-empty string",
    typeof todoDetail.title === "string" && todoDetail.title.length > 0,
  );
  TestValidator.predicate(
    "todo status is valid",
    todoDetail.status === "pending" ||
      todoDetail.status === "in-progress" ||
      todoDetail.status === "completed",
  );
  TestValidator.predicate(
    "created_at is valid ISO date-time string",
    typeof todoDetail.created_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.+Z$/.test(todoDetail.created_at),
  );
  TestValidator.predicate(
    "updated_at is valid ISO date-time string",
    typeof todoDetail.updated_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.+Z$/.test(todoDetail.updated_at),
  );
  TestValidator.predicate(
    "deleted_at is null, undefined, or valid ISO date-time string",
    todoDetail.deleted_at === null ||
      todoDetail.deleted_at === undefined ||
      (typeof todoDetail.deleted_at === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.+Z$/.test(todoDetail.deleted_at)),
  );
  TestValidator.predicate(
    "description is string, null, or undefined",
    todoDetail.description === null ||
      todoDetail.description === undefined ||
      (typeof todoDetail.description === "string" &&
        todoDetail.description.length >= 0),
  );
}
