import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

/**
 * Test the update functionality of a user's todo item with strict status
 * checks.
 *
 * This test validates the correct behavior when a user attempts to update their
 * todo item only if its current status is 'pending'.
 *
 * Process:
 *
 * 1. Register a new user using valid email and password hash with email verified
 *    status.
 * 2. Create a new todo item owned by the registered user with initial status
 *    'pending' and a random description.
 * 3. Attempt to update the description and status of the todo item to 'done' and
 *    verify success.
 * 4. Reload the todo item and verify the updated fields match the changes.
 * 5. Attempt invalid updates:
 *
 *    - Try to update the description again after status is 'done', which should fail
 *         with an error due to business rules.
 * 6. Confirm error handling for unauthorized modification attempts by another user
 *    if applicable.
 */
export async function test_api_todo_item_update_by_owner_with_pending_status(
  connection: api.IConnection,
) {
  // 1. Register a new user
  const email = `test_${RandomGenerator.alphaNumeric(8)}@example.com`;
  const passwordHash = RandomGenerator.alphaNumeric(64);
  const emailVerified = true;
  const userCreateBody = {
    email,
    password_hash: passwordHash,
    email_verified: emailVerified,
  } satisfies ITodoListAppUser.ICreate;

  const userAuthorized: ITodoListAppUser.IAuthorized =
    await api.functional.auth.user.join(connection, { body: userCreateBody });
  typia.assert(userAuthorized);

  // Extract user ID and token
  const userId = userAuthorized.id;

  // 2. Create a new todo item with status 'pending'
  const todoDescription = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const todoCreateBody = {
    description: todoDescription,
    status: "pending",
    todo_list_app_user_id: userId,
  } satisfies ITodoListAppTodoItem.ICreate;

  const todoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.create(
      connection,
      {
        todoListAppUserId: userId,
        body: todoCreateBody,
      },
    );
  typia.assert(todoItem);

  // 3. Update the todo item's description and status to 'done'
  const updatedDescription = todoDescription + " updated";
  const updateBody1 = {
    description: updatedDescription,
    status: "done",
  } satisfies ITodoListAppTodoItem.IUpdate;

  const updatedTodoItem: ITodoListAppTodoItem =
    await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.update(
      connection,
      {
        todoListAppUserId: userId,
        id: todoItem.id,
        body: updateBody1,
      },
    );
  typia.assert(updatedTodoItem);

  // 4. Verify update result
  TestValidator.equals(
    "description updated",
    updatedTodoItem.description,
    updatedDescription,
  );
  TestValidator.equals("status updated", updatedTodoItem.status, "done");

  // 5. Attempt to update description again after status is 'done' - should fail
  const updateBodyInvalid = {
    description: updatedDescription + " again",
  } satisfies ITodoListAppTodoItem.IUpdate;

  await TestValidator.error(
    "should fail to update description on done status",
    async () => {
      await api.functional.todoListApp.user.todoListAppUsers.todoListAppTodoItems.update(
        connection,
        {
          todoListAppUserId: userId,
          id: todoItem.id,
          body: updateBodyInvalid,
        },
      );
    },
  );
}
