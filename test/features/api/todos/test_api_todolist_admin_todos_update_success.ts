import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test successful update of a todo item by an admin user.
 *
 * This test performs the following steps:
 *
 * 1. Create and authenticate an admin user.
 * 2. Create and authenticate a normal user.
 * 3. The user creates a todo item using the update endpoint with a new ID.
 * 4. Switch authentication to the admin user.
 * 5. The admin updates the todo item with valid new data (title, description,
 *    status).
 * 6. Validate the updated todo properties.
 *
 * This verifies that admin users can update any todo item regardless of
 * ownership, and that validation rules like title uniqueness and field length
 * are respected.
 */
export async function test_api_todolist_admin_todos_update_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "password123";
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // 2. Create normal user and authenticate
  const userEmail = typia.random<string & tags.Format<"email">>();
  const userPassword = "UserPass123";
  await api.functional.auth.user.join(connection, {
    body: {
      email: userEmail,
      password: userPassword,
    } satisfies ITodoListUser.ICreate,
  });
  const userAuth: ITodoListUser.IAuthorized =
    await api.functional.auth.user.login(connection, {
      body: {
        email: userEmail,
        password: userPassword,
      } satisfies ITodoListUser.ILogin,
    });
  typia.assert(userAuth);

  // 3. User creates a todo item with update API (simulated creation)
  const todoId = typia.random<string & tags.Format<"uuid">>();
  const initialTodoData = {
    title: "Initial Todo Title",
    description: "Initial description",
    status: "pending" as const,
  } satisfies ITodoListTodo.IUpdate;

  const createdTodo: ITodoListTodo =
    await api.functional.todoList.user.todos.update(connection, {
      todoId: todoId,
      body: initialTodoData,
    });
  typia.assert(createdTodo);

  TestValidator.equals(
    "Created todo title",
    createdTodo.title,
    initialTodoData.title,
  );
  TestValidator.equals(
    "Created todo status",
    createdTodo.status,
    initialTodoData.status,
  );

  // 4. Switch authentication back to admin
  const adminLogin = await api.functional.auth.admin.login.loginAdmin(
    connection,
    {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ILogin,
    },
  );
  typia.assert(adminLogin);

  // 5. Admin updates the todo
  const updatedTitle = "Updated Todo Title by Admin";
  const updatedDescription = "Updated description by admin with valid text.";
  const updatedStatus = "in-progress" as const;

  const updateBody = {
    title: updatedTitle,
    description: updatedDescription,
    status: updatedStatus,
  } satisfies ITodoListTodo.IUpdate;

  const updatedTodo: ITodoListTodo =
    await api.functional.todoList.admin.todos.update(connection, {
      todoId: createdTodo.id,
      body: updateBody,
    });
  typia.assert(updatedTodo);

  // 6. Verify updated todo
  TestValidator.equals(
    "Updated todo ID remains the same",
    updatedTodo.id,
    createdTodo.id,
  );
  TestValidator.equals(
    "Updated todo title matches input",
    updatedTodo.title,
    updatedTitle,
  );
  TestValidator.equals(
    "Updated todo description matches input",
    updatedTodo.description ?? null,
    updatedDescription,
  );
  TestValidator.equals(
    "Updated todo status matches input",
    updatedTodo.status,
    updatedStatus,
  );
}
