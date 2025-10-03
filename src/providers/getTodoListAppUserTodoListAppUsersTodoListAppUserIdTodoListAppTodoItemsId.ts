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
 * Get details of a specific todo item owned by a user.
 *
 * Retrieves the todo item specified by its UUID and the owning user's UUID.
 * Ensures the authenticated user is authorized to access the item.
 *
 * @param props - Parameters including authenticated user, todoListAppUserId,
 *   and todo item id
 * @param props.user - Authenticated user payload
 * @param props.todoListAppUserId - UUID of the user who owns the todo item
 * @param props.id - UUID of the todo item
 * @returns Detailed todo item data including description, status, created_at
 *   and updated_at
 * @throws HttpException 403 if the authenticated user is not the owner
 * @throws HttpException 404 if the todo item does not exist
 */
export async function getTodoListAppUserTodoListAppUsersTodoListAppUserIdTodoListAppTodoItemsId(props: {
  user: UserPayload;
  todoListAppUserId: string & tags.Format<"uuid">;
  id: string & tags.Format<"uuid">;
}): Promise<ITodoListAppTodoItem> {
  const { user, todoListAppUserId, id } = props;

  if (user.id !== todoListAppUserId) {
    throw new HttpException(
      "Forbidden: You can only access your own todo items",
      403,
    );
  }

  const todoItem =
    await MyGlobal.prisma.todo_list_app_todo_items.findUniqueOrThrow({
      where: { id },
    });

  if (todoItem.todo_list_app_user_id !== todoListAppUserId) {
    throw new HttpException(
      "Forbidden: You can only access your own todo items",
      403,
    );
  }

  return {
    id: todoItem.id,
    todo_list_app_user_id: todoItem.todo_list_app_user_id,
    description: todoItem.description,
    status: todoItem.status === "pending" ? "pending" : "done",
    created_at: toISOStringSafe(todoItem.created_at),
    updated_at: toISOStringSafe(todoItem.updated_at),
  };
}
