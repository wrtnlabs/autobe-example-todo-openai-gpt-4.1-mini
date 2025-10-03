import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Delete a todo item permanently.
 *
 * Removes a todo item owned by the specified user from the database. This
 * operation performs a hard delete since the todo item table does not support
 * soft delete. Ownership is verified to enforce authorization.
 *
 * @param props - The function parameters containing user authentication and
 *   identifiers
 * @param props.user - Authenticated user making the request
 * @param props.todoListAppUserId - ID of the user who owns the todo item
 * @param props.id - ID of the todo item to delete
 * @throws {HttpException} Throws 403 if the authenticated user is not the owner
 * @throws {HttpException} Throws 404 if the todo item does not exist
 */
export async function deleteTodoListAppUserTodoListAppUsersTodoListAppUserIdTodoListAppTodoItemsId(props: {
  user: UserPayload;
  todoListAppUserId: string & tags.Format<"uuid">;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { user, todoListAppUserId, id } = props;

  const todoItem =
    await MyGlobal.prisma.todo_list_app_todo_items.findUniqueOrThrow({
      where: { id },
      select: { todo_list_app_user_id: true },
    });

  if (todoItem.todo_list_app_user_id !== user.id) {
    throw new HttpException(
      "Unauthorized: not the owner of this todo item",
      403,
    );
  }

  await MyGlobal.prisma.todo_list_app_todo_items.delete({
    where: { id },
  });
}
