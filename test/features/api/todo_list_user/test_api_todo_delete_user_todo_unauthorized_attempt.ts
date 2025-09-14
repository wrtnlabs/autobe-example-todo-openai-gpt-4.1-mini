import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

export async function test_api_todo_delete_user_todo_unauthorized_attempt(
  connection: api.IConnection,
) {
  // Prepare separate connection objects for User A and User B
  const connectionUserA: api.IConnection = { ...connection, headers: {} };
  const connectionUserB: api.IConnection = { ...connection, headers: {} };

  // 1. Create User A with unique email and password
  const userABody = {
    email: `userA_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "Password123!",
  } satisfies ITodoListUser.ICreate;
  const userA: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connectionUserA,
    {
      body: userABody,
    },
  );
  typia.assert(userA);

  // Simulate todoId creation by generating random UUID
  const todoId = typia.random<string & tags.Format<"uuid">>();

  // 2. Create User B with unique email and password
  const userBBody = {
    email: `userB_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "Password123!",
  } satisfies ITodoListUser.ICreate;
  const userB: ITodoListUser.IAuthorized = await api.functional.auth.user.join(
    connectionUserB,
    {
      body: userBBody,
    },
  );
  typia.assert(userB);

  // 3. User B attempts to delete User A's todo using User B's authenticated connection
  await TestValidator.error(
    "User B cannot delete User A's todo item",
    async () => {
      await api.functional.todoList.user.todos.erase(connectionUserB, {
        todoId: todoId,
      });
    },
  );
}
