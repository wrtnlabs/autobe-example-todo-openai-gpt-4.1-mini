import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

export async function test_api_todo_delete_admin_todo_permission_denied(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate a normal user
  const userEmail = typia.random<string & tags.Format<"email">>();
  const normalUser = await api.functional.auth.user.join(connection, {
    body: {
      email: userEmail,
      password: "UserPass1234",
    } satisfies ITodoListUser.ICreate,
  });
  typia.assert(normalUser);

  // Capture token automatically handled by SDK

  // Step 2: Create and authenticate an admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser = await api.functional.auth.admin.join.joinAdmin(connection, {
    body: {
      email: adminEmail,
      password: "AdminPass1234",
    } satisfies ITodoListAdmin.ICreate,
  });
  typia.assert(adminUser);

  await api.functional.auth.admin.login.loginAdmin(connection, {
    body: {
      email: adminEmail,
      password: "AdminPass1234",
    } satisfies ITodoListAdmin.ILogin,
  });

  // Step 3: Switch back to normal user login to test deletion attempt
  await api.functional.auth.user.login(connection, {
    body: {
      email: userEmail,
      password: "UserPass1234",
    } satisfies ITodoListUser.ILogin,
  });

  // Step 4: Attempt deletion of a random todoId as normal user and expect failure
  const randomTodoId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "normal user cannot delete todo via admin endpoint",
    async () => {
      await api.functional.todoList.admin.todos.erase(connection, {
        todoId: randomTodoId,
      });
    },
  );
}
