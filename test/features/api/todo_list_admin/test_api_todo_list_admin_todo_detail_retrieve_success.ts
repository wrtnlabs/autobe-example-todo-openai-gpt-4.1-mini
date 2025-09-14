import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";

/**
 * This E2E test verifies that an administrator user can successfully retrieve
 * detailed information for a todo item by its unique todoId.
 *
 * The test flow includes:
 *
 * 1. Creating an admin user with unique email and password.
 * 2. Utilizing the admin authentication context established.
 * 3. Using a realistic todoId to retrieve the detailed todo item.
 * 4. Validating key properties like id, title, status, timestamps, and user
 *    linkage.
 *
 * This confirms proper admin authorization and accurate todo item retrieval.
 */
export async function test_api_todo_list_admin_todo_detail_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Create admin user with unique email and password
  const adminEmail: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const adminPassword = "StrongPassword123!";
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // 2. Generate a realistic Todo UUID for retrieval
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 3. Retrieve the todo detail by todoId
  const todo: ITodoListTodo = await api.functional.todoList.admin.todos.at(
    connection,
    { todoId },
  );
  typia.assert(todo);

  // 4. Validate critical properties
  TestValidator.predicate(
    "todo id is uuid format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      todo.id,
    ),
  );
  TestValidator.predicate(
    "todo title exists",
    typeof todo.title === "string" && todo.title.length > 0,
  );
  TestValidator.predicate(
    "todo status is valid",
    ["pending", "in-progress", "completed"].includes(todo.status),
  );
  TestValidator.predicate(
    "todo_list_user_id is uuid format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      todo.todo_list_user_id,
    ),
  );
}
