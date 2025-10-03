import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Updates an existing todo item owned by the specified user.
 *
 * Enforces that only the authenticated user owning the todo item can perform
 * the update. Description updates are allowed only if the current status is
 * 'pending'. Status must be either 'pending' or 'done'.
 *
 * Throws 403 if the authenticated user does not own the todo item. Throws 400
 * if trying to update description when status is not 'pending', or invalid
 * status value. Throws 404 if the todo item does not exist.
 *
 * @param props - Object containing user payload, user ID, todo item ID, and
 *   update body
 * @returns Updated todo item entity
 * @throws {HttpException} 403 if unauthorized access
 * @throws {HttpException} 400 for validation errors
 * @throws {HttpException} 404 if item not found
 */
export async function putTodoListAppUserTodoListAppUsersTodoListAppUserIdTodoListAppTodoItemsId(props: {
  user: UserPayload;
  todoListAppUserId: string & tags.Format<"uuid">;
  id: string & tags.Format<"uuid">;
  body: ITodoListAppTodoItem.IUpdate;
}): Promise<ITodoListAppTodoItem> {
  const { user, todoListAppUserId, id, body } = props;

  // Authorization check
  if (user.id !== todoListAppUserId) {
    throw new HttpException(
      "Unauthorized: You can only update your own todo items",
      403,
    );
  }

  // Find the existing todo item and verify ownership
  const existing =
    await MyGlobal.prisma.todo_list_app_todo_items.findFirstOrThrow({
      where: {
        id,
        todo_list_app_user_id: todoListAppUserId,
      },
    });

  // Validate status if present
  if (
    body.status !== undefined &&
    body.status !== "pending" &&
    body.status !== "done"
  ) {
    throw new HttpException("Invalid status value", 400);
  }

  // Enforce description update only if current status is 'pending'
  if (body.description !== undefined && existing.status !== "pending") {
    throw new HttpException(
      "Description can only be updated if current status is 'pending'",
      400,
    );
  }

  // Prepare update data with updated_at
  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.todo_list_app_todo_items.update({
    where: { id },
    data: {
      description: body.description ?? undefined,
      status: body.status ?? undefined,
      updated_at: now,
    },
  });

  // Return updated todo item with date conversions
  return {
    id: updated.id,
    todo_list_app_user_id: updated.todo_list_app_user_id,
    description: updated.description,
    status: updated.status === "pending" ? "pending" : "done",
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
