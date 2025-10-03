import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListAppTodoItem";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_todo_items_list_retrieval_by_user(
  connection: api.IConnection,
) {
  // 1. Register a new user to obtain the auth token and user ID
  const userCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@example.com",
    password_hash: RandomGenerator.alphaNumeric(16),
    email_verified: true,
  } satisfies ITodoListAppUser.ICreate;
  const authorizedUser: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: userCreateBody,
    });
  typia.assert(authorizedUser);

  // 2. Create a todo item for this user to have data to retrieve
  const todoCreateBody = {
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 8,
    }),
    status: "pending",
    todo_list_app_user_id: authorizedUser.id,
  } satisfies ITodoListAppTodoItem.ICreate;
  const todoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        body: todoCreateBody,
      },
    );
  typia.assert(todoItem);

  // 3. Prepare request body for indexing todo items with pagination and optional search
  const patchRequestBody = {
    page: 1,
    limit: 10,
    search: todoCreateBody.description.substring(0, 6), // partial search term
  } satisfies ITodoListAppTodoItem.IRequest;

  // 4. Retrieve todo items list for this user
  const todoListResponse: IPageITodoListAppTodoItem.ISummary =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.index(
      connection,
      {
        todoListAppUserId: authorizedUser.id,
        body: patchRequestBody,
      },
    );
  typia.assert(todoListResponse);

  // 5. Validate pagination metadata
  const pagination = todoListResponse.pagination;
  TestValidator.predicate(
    "page number should be at least 1",
    pagination.current >= 1,
  );
  TestValidator.predicate("limit should be positive", pagination.limit > 0);
  TestValidator.predicate(
    "total records should be at least 1",
    pagination.records >= 1,
  );
  TestValidator.predicate("pages should be at least 1", pagination.pages >= 1);

  // 6. Validate that every returned todo item matches search term and has valid properties
  for (const task of todoListResponse.data) {
    TestValidator.predicate(
      "todo item description includes search term",
      task.description.includes(patchRequestBody.search!),
    );
    TestValidator.predicate(
      "todo item status is valid",
      task.status === "pending" || task.status === "done",
    );
    TestValidator.predicate(
      "todo item created_at is ISO date",
      !isNaN(Date.parse(task.created_at)),
    );
  }

  // 7. Confirm the created todo item is in the retrieved list
  const found = todoListResponse.data.find((t) => t.id === todoItem.id);
  TestValidator.predicate(
    "created todo item should exist in result",
    found !== undefined,
  );
  if (found !== undefined) {
    TestValidator.equals(
      "created todo item description matches",
      found.description,
      todoCreateBody.description,
    );
    TestValidator.equals(
      "created todo item status matches",
      found.status,
      todoCreateBody.status,
    );
  }
}
