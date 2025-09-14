import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodos";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";

/**
 * Test to validate that an admin user can successfully retrieve a filtered
 * and paginated list of todos for a specific user.
 *
 * The test follows these steps:
 *
 * 1. Create a new admin user by invoking the admin join API with a valid
 *    unique email and password.
 * 2. Ensure the admin user is authenticated by verifying the authorized
 *    response.
 * 3. Execute the patch API to retrieve todos for a specific user ID, supplying
 *    filter parameters such as page, limit, status, search, and orderBy.
 * 4. Assert the structure and content of the returned paginated todo list.
 * 5. Verify that the todos returned belong to the specified user and that the
 *    pagination information is present and valid.
 */
export async function test_api_todo_list_admin_user_todos_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "secure_password_123";

  // 2. Call admin join API to create and authenticate admin user
  const adminAuthorized: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(adminAuthorized);

  // 3. Define target user ID for which todos will be retrieved
  const targetUserId = typia.random<string & tags.Format<"uuid">>();

  // 4. Define filter and pagination parameters
  const requestBody = {
    page: 1,
    limit: 10,
    status: "pending" as const,
    search: "some search text",
    orderBy: "created_at DESC",
  } satisfies ITodoListTodos.IRequest;

  // 5. Call the todo list retrieval API as admin user
  const pagedTodos: IPageITodoListTodos =
    await api.functional.todoList.admin.users.todos.index(connection, {
      userId: targetUserId,
      body: requestBody,
    });
  typia.assert(pagedTodos);

  // 6. Validate pagination info
  TestValidator.predicate(
    "pagination current page >= 1",
    pagedTodos.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit > 0",
    pagedTodos.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination total pages >= 1",
    pagedTodos.pagination.pages >= 1,
  );
  TestValidator.predicate(
    "pagination records >= 0",
    pagedTodos.pagination.records >= 0,
  );

  // 7. Validate each todo item
  for (const todo of pagedTodos.data) {
    typia.assert(todo);
    TestValidator.equals(
      "todo user id matches target user",
      todo.todo_list_user_id,
      targetUserId,
    );
    if (requestBody.status !== null && requestBody.status !== undefined) {
      TestValidator.equals(
        "todo status matches filter",
        todo.status,
        requestBody.status,
      );
    }
    if (requestBody.search && typeof todo.title === "string") {
      TestValidator.predicate(
        "todo title includes search text",
        todo.title.includes(requestBody.search),
      );
    }
  }
}
