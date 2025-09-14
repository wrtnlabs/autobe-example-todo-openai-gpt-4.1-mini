import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * This test validates the ability of an authenticated user to retrieve their
 * own todo item's details from the todo list service.
 *
 * It covers the following process:
 *
 * 1. Create a new user account via the 'join' API endpoint with valid email and
 *    password.
 * 2. Authenticate the new user via the 'login' endpoint to establish valid
 *    authentication tokens.
 * 3. Fetch the detailed information of a todo item by a given todoId and userId.
 * 4. Validate that the returned todo details conform to expected schema and
 *    business rules.
 *
 * Note: Since no create todo API is available, this test retrieves a todo with
 * a generated uuid as a placeholder. In a full system, todo creation or fixture
 * setup would be necessary.
 */
export async function test_api_todo_user_retrieve_own_todo_detail_success(
  connection: api.IConnection,
) {
  // 1. Create a new user account
  const email = `${RandomGenerator.name(1).toLowerCase()}@example.com`;
  const password = RandomGenerator.alphaNumeric(16);
  const userAuthorized: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: {
        email: email,
        password: password,
      } satisfies ITodoListUser.ICreate,
    });
  typia.assert(userAuthorized);

  // 2. Log the user in to establish authentication context
  const userLogin: ITodoListUser.IAuthorized =
    await api.functional.auth.user.login(connection, {
      body: {
        email: email,
        password: password,
      } satisfies ITodoListUser.ILogin,
    });
  typia.assert(userLogin);
  TestValidator.equals(
    "login user id matches joined user",
    userLogin.id,
    userAuthorized.id,
  );
  TestValidator.equals(
    "login user email matches joined user",
    userLogin.email,
    userAuthorized.email,
  );

  // 3. Attempt to fetch a todo detail for this user with a generated todoId (no creation API provided)
  const todoId = typia.random<string & tags.Format<"uuid">>();

  const responseTodo: ITodoListTodos =
    await api.functional.todoList.user.users.todos.at(connection, {
      userId: userAuthorized.id,
      todoId: todoId,
    });
  typia.assert(responseTodo);

  // 4. Validate basic properties of the returned todo
  TestValidator.equals(
    "todo owner user id matches",
    responseTodo.todo_list_user_id,
    userAuthorized.id,
  );
  TestValidator.predicate(
    "todo status is valid",
    ["pending", "in-progress", "completed"].includes(responseTodo.status),
  );
  TestValidator.predicate(
    "todo created_at is a valid ISO date",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      responseTodo.created_at,
    ),
  );
  TestValidator.predicate(
    "todo updated_at is a valid ISO date",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      responseTodo.updated_at,
    ),
  );
  // deleted_at can be null or undefined; test for null or undefined
  TestValidator.predicate(
    "todo deleted_at is null or undefined",
    responseTodo.deleted_at === null || responseTodo.deleted_at === undefined,
  );
}
