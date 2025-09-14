import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

export async function test_api_todo_admin_retrieve_user_todo_detail_success(
  connection: api.IConnection,
) {
  // Step 1: Create admin user with unique email and password
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "password123";

  const adminCreated: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(adminCreated);

  // Step 2: Login as the created admin user
  const adminLoggedIn: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ILogin,
    });
  typia.assert(adminLoggedIn);

  // Step 3: Generate valid UUIDs for userId and todoId
  const userId = typia.random<string & tags.Format<"uuid">>();
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // Step 4: Retrieve todo detail as admin
  const todoDetail: ITodoListTodos =
    await api.functional.todoList.admin.users.todos.at(connection, {
      userId,
      todoId,
    });
  typia.assert(todoDetail);

  // Step 5: Validate essential todo item properties
  TestValidator.equals(
    "Todo userId matches",
    todoDetail.todo_list_user_id,
    userId,
  );
  TestValidator.equals("Todo id matches", todoDetail.id, todoId);
  TestValidator.predicate(
    "Todo status is valid",
    todoDetail.status === "pending" ||
      todoDetail.status === "in-progress" ||
      todoDetail.status === "completed",
  );
  TestValidator.predicate(
    "Todo created_at is ISO datetime",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(todoDetail.created_at),
  );
  TestValidator.predicate(
    "Todo updated_at is ISO datetime",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(todoDetail.updated_at),
  );
  // Soft delete can be null or undefined
  TestValidator.predicate(
    "Todo deleted_at is ISO datetime or null or undefined",
    todoDetail.deleted_at === null ||
      todoDetail.deleted_at === undefined ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
        todoDetail.deleted_at ?? "",
      ),
  );
}
