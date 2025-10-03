import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_todo_item_deletion_by_owner(
  connection: api.IConnection,
) {
  // 1. Register a new user
  const email1 = typia.random<string & tags.Format<"email">>();
  const user1: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: {
        email: email1,
        password_hash: RandomGenerator.alphaNumeric(32),
        email_verified: true,
      } satisfies ITodoListAppUser.ICreate,
    });
  typia.assert(user1);

  // 2. Create a todo item for this user
  const todoDescription = RandomGenerator.paragraph({ sentences: 3 });
  const todoInput = {
    description: todoDescription,
    status: "pending",
    todo_list_app_user_id: user1.id,
  } satisfies ITodoListAppTodoItem.ICreate;

  const todoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: user1.id,
        body: todoInput,
      },
    );
  typia.assert(todoItem);

  TestValidator.equals(
    "todoItem owner matches user1",
    todoItem.todo_list_app_user_id,
    user1.id,
  );

  // 3. Delete the created todo item by the same user
  await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.erase(
    connection,
    {
      todoListAppUserId: user1.id,
      id: todoItem.id,
    },
  );

  // 4. Attempt to delete the same todo item again, expect failure
  await TestValidator.error(
    "deleting already deleted todo item should fail",
    async () => {
      await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.erase(
        connection,
        {
          todoListAppUserId: user1.id,
          id: todoItem.id,
        },
      );
    },
  );

  // 5. Negative test: Second user cannot delete first user's todo item
  const email2 = typia.random<string & tags.Format<"email">>();
  const user2: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, {
      body: {
        email: email2,
        password_hash: RandomGenerator.alphaNumeric(32),
        email_verified: true,
      } satisfies ITodoListAppUser.ICreate,
    });
  typia.assert(user2);

  // Since todoItem is deleted, create another todo for user1 to test negative case
  const todoItem2: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: user1.id,
        body: {
          description: RandomGenerator.paragraph({ sentences: 2 }),
          status: "pending",
          todo_list_app_user_id: user1.id,
        } satisfies ITodoListAppTodoItem.ICreate,
      },
    );
  typia.assert(todoItem2);

  await TestValidator.error(
    "user2 cannot delete user1's todo item",
    async () => {
      await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.erase(
        connection,
        {
          todoListAppUserId: user2.id,
          id: todoItem2.id,
        },
      );
    },
  );
}
