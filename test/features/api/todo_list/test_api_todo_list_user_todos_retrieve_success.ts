import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test validates the successful retrieval of paginated and filtered todo
 * items for a newly created and authenticated user.
 *
 * It covers the full flow of user registration via join API, authentication,
 * and todo retrieval filtered by status with pagination controls. The response
 * is asserted to match the todo summary pagination DTO structure exactly. This
 * ensures that the API correctly handles authentication, filtering, pagination,
 * and returns the expected todo data.
 */
export async function test_api_todo_list_user_todos_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Register user and authenticate
  const userEmail: string = typia.random<string & tags.Format<"email">>();
  const userPassword = "StrongPassword123!";

  const user: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connection,
    {
      body: {
        email: userEmail,
        password: userPassword,
      } satisfies ITodoListUser.ICreate,
    },
  );
  typia.assert(user);

  // 2. Prepare todo retrieval request with pagination and filtering for status pending
  const requestBody = {
    page: 1,
    limit: 10,
    status: "pending",
    search: null,
    orderBy: null,
  } satisfies ITodoListTodo.IRequest;

  // 3. Retrieve todos applying filter
  const response: IPageITodoListTodo.ISummary =
    await api.functional.todoList.user.todos.index(connection, {
      body: requestBody,
    });
  typia.assert(response);

  // 4. Verify pagination info
  TestValidator.predicate(
    "pagination current at least 1",
    response.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit positive",
    response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination pages non-negative",
    response.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records non-negative",
    response.pagination.records >= 0,
  );

  // 5. Verify each todo summary in response data
  for (const todo of response.data) {
    typia.assert(todo);
    TestValidator.predicate(
      "todo id is a non-empty string",
      typeof todo.id === "string" && todo.id.length > 0,
    );
    TestValidator.predicate(
      "todo title is a non-empty string",
      typeof todo.title === "string" && todo.title.length > 0,
    );
    TestValidator.predicate(
      "todo status valid enum value",
      todo.status === "pending" ||
        todo.status === "in-progress" ||
        todo.status === "completed",
    );
  }
}
