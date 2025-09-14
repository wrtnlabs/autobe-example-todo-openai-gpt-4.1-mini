import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodos";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

export async function test_api_todo_retrieve_user_todos_as_admin_success(
  connection: api.IConnection,
) {
  // Step 1: Admin join with realistic email and password
  const adminEmail = `admin_${RandomGenerator.alphaNumeric(5)}@todoapp.example.com`;
  const adminPassword = "StrongP@ssw0rd";
  const joinBody = {
    email: adminEmail,
    password: adminPassword,
  } satisfies ITodoListAdmin.ICreate;
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: joinBody,
    });
  typia.assert(adminAuthorized);

  // Step 2: Admin login with same credentials to confirm authentication and context
  const loginBody = {
    email: adminEmail,
    password: adminPassword,
  } satisfies ITodoListAdmin.ILogin;
  const loginAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.login.loginAdmin(connection, {
      body: loginBody,
    });
  typia.assert(loginAuthorized);

  // Step 3: Prepare userId for which todos will be retrieved - use random UUID
  const userId = typia.random<string & tags.Format<"uuid">>();

  // Step 4: Prepare request body parameters - with pagination and random status filter
  const possibleStatuses = ["pending", "in-progress", "completed"] as const;
  const statusFilter = RandomGenerator.pick(possibleStatuses);
  const requestBody = {
    page: 1,
    limit: 10,
    status: statusFilter,
    search: null,
    orderBy: null,
  } satisfies ITodoListTodos.IRequest;

  // Step 5: Admin retrieves paginated todos for the specified userId with filters
  const response: IPageITodoListTodos =
    await api.functional.todoList.admin.users.todos.index(connection, {
      userId: userId,
      body: requestBody,
    });
  typia.assert(response);

  // Step 6: Validate response fields exist and pagination numbers are sensible
  TestValidator.predicate(
    "pagination current is at least 1",
    response.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records count is non-negative",
    response.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count is at least 1",
    response.pagination.pages >= 1,
  );

  // Step 7: Validate that each todo item belongs to the requested userId and status matches filter
  response.data.forEach((todo, index) => {
    TestValidator.equals(
      `todo[${index}].todo_list_user_id matches userId`,
      todo.todo_list_user_id,
      userId,
    );
    TestValidator.predicate(
      `todo[${index}].status is valid`,
      possibleStatuses.includes(todo.status),
    );
    if (requestBody.status !== null) {
      TestValidator.equals(
        `todo[${index}].status matches filter`,
        todo.status,
        requestBody.status,
      );
    }
  });
}
