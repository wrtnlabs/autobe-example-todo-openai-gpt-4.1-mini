import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test the happy path of updating a user's todo item by an admin user.
 *
 * This test ensures that an admin user can update a todo item belonging to
 * another user. It covers the following steps:
 *
 * 1. Create an admin user account
 * 2. Create a regular user account
 * 3. Retrieve an existing todo item for the regular user via the user's todo
 *    list retrieval endpoint (due to lack of todo creation API)
 * 4. Login as the admin user
 * 5. Update the todo item with a new title, description, and status
 * 6. Validate the update succeeded and the todo data reflects the changes
 *
 * All identifiers are generated using typia. Emails and other string values
 * respect format constraints. Status values use exact allowed enum strings.
 * The test uses typia.assert for full runtime type validation and rigorous
 * TestValidator assertions to ensure the correct API behavior.
 *
 * Note: Due to absence of todo creation API, this test retrieves an
 * existing todo via the user todos index endpoint instead of creating one
 * from scratch. This adaptation ensures compliance with the provided API
 * capabilities.
 */
export async function test_api_todo_update_admin_user_todo_happy_path(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "AdminPass123!";
  const adminUser: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create regular user
  const userEmail = typia.random<string & tags.Format<"email">>();
  const userPassword = "UserPass123!";
  const regularUser: ITodoListUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: {
        email: userEmail,
        password: userPassword,
      } satisfies ITodoListUser.ICreate,
    });
  typia.assert(regularUser);

  // 3. Retrieve todos for the user (simulate that a todo exists, as creation API missing)
  const todoListResponse: IPageITodoListTodo.ISummary =
    await api.functional.todoList.user.todos.index(connection, {
      body: {
        page: 1,
        limit: 10,
        status: null,
        search: null,
        orderBy: null,
      } satisfies ITodoListTodo.IRequest,
    });
  typia.assert(todoListResponse);

  // Find a todo belonging to the created user
  const userTodo = todoListResponse.data.find(
    (todo) => typeof todo.id === "string" && todo.title.length > 0,
  );
  // In case no todo exists, fail the test
  if (!userTodo) {
    throw new Error(
      "No todo item found for the user to update; consider seeding todos.",
    );
  }

  // 4. Admin user login
  await api.functional.auth.admin.login.loginAdmin(connection, {
    body: {
      email: adminEmail,
      password: adminPassword,
    } satisfies ITodoListAdmin.ILogin,
  });

  // 5. Update the todo item as admin
  const newTitle = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const newDescription = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 5,
    sentenceMax: 10,
    wordMin: 4,
    wordMax: 8,
  });
  const newStatus: "pending" | "in-progress" | "completed" =
    RandomGenerator.pick(["pending", "in-progress", "completed"] as const);

  const updatedTodo: ITodoListTodos =
    await api.functional.todoList.admin.users.todos.update(connection, {
      userId: regularUser.id,
      todoId: userTodo.id,
      body: {
        title: newTitle,
        description: newDescription,
        status: newStatus,
      } satisfies ITodoListTodos.IUpdate,
    });
  typia.assert(updatedTodo);

  // 6. Validate update results
  TestValidator.equals(
    "updated todo userId matches regular user",
    updatedTodo.todo_list_user_id,
    regularUser.id,
  );
  TestValidator.equals(
    "updated todo id matches todo id",
    updatedTodo.id,
    userTodo.id,
  );
  TestValidator.equals(
    "updated todo title matches",
    updatedTodo.title,
    newTitle,
  );
  TestValidator.equals(
    "updated todo description matches",
    updatedTodo.description,
    newDescription,
  );
  TestValidator.equals(
    "updated todo status matches",
    updatedTodo.status,
    newStatus,
  );
}
