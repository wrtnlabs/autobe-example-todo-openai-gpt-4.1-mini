import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodos";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Validates the retrieval of a filtered, sorted, and paginated todo list
 * for a user.
 *
 * This test simulates the entire flow for an authenticated user to retrieve
 * their todos with specific filters and pagination settings.
 *
 * 1. Create and authenticate the user.
 * 2. Use the authenticated user's ID to request the todo list with filters.
 * 3. Assert that all returned todos belong to the requested user.
 * 4. Assert that the pagination and filtering logic is correctly applied and
 *    response is valid.
 */
export async function test_api_todo_list_user_user_todos_retrieve_success(
  connection: api.IConnection,
) {
  // 1. User registration and authentication
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(20),
  } satisfies ITodoListUser.ICreate;
  const authorizedUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: joinBody,
    });
  typia.assert(authorizedUser);

  // 2. Request the paginated, filtered todo list for the authenticated user
  const requestBody = {
    page: 1,
    limit: 10,
    status: "pending",
    search: "",
    orderBy: "created_at",
  } satisfies ITodoListTodos.IRequest;
  const todoListPage: IPageITodoListTodos =
    await api.functional.todoList.user.users.todos.index(connection, {
      userId: typia.assert<string & tags.Format<"uuid">>(authorizedUser.id),
      body: requestBody,
    });
  typia.assert(todoListPage);

  // 3. Validate all todos belong to the authenticated user
  for (const todo of todoListPage.data) {
    TestValidator.equals(
      "todo item user id matches requested user",
      todo.todo_list_user_id,
      authorizedUser.id,
    );
    if (requestBody.status !== null && requestBody.status !== undefined) {
      TestValidator.equals(
        "todo item status matches requested filter",
        todo.status,
        requestBody.status,
      );
    }
  }

  // 4. Validate pagination properties
  const pagination = todoListPage.pagination;
  TestValidator.predicate(
    "pagination current page is valid",
    pagination.current === 1,
  );
  TestValidator.predicate("pagination limit is valid", pagination.limit === 10);
  TestValidator.predicate(
    "pagination records count is non-negative",
    pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count matches expected",
    pagination.pages >= 0 &&
      (pagination.pages === 0 || pagination.pages >= pagination.current),
  );
}
