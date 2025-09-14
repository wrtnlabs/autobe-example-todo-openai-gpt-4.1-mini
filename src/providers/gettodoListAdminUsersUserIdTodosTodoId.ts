import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieves a specific todo item for a user as an admin.
 *
 * This operation fetches detailed information of a single todo item identified
 * by todoId and belonging to the specified userId. Authorization restricts
 * access to administrators only.
 *
 * @param props - Object containing admin credentials, userId, and todoId.
 * @param props.admin - Authenticated admin user performing the request.
 * @param props.userId - UUID of the user owning the todo item.
 * @param props.todoId - UUID of the todo item to retrieve.
 * @returns Detailed todo item information conforming to ITodoListTodos.
 * @throws {Error} When the todo item does not exist or does not belong to the
 *   user.
 */
export async function gettodoListAdminUsersUserIdTodosTodoId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
}): Promise<ITodoListTodos> {
  const { admin, userId, todoId } = props;

  const todo = await MyGlobal.prisma.todo_list_todos.findUniqueOrThrow({
    where: {
      id: todoId,
      todo_list_user_id: userId,
    },
  });

  return {
    id: todo.id,
    todo_list_user_id: todo.todo_list_user_id,
    title: todo.title,
    description: todo.description ?? null,
    status: todo.status as "pending" | "in-progress" | "completed",
    created_at: toISOStringSafe(todo.created_at),
    updated_at: toISOStringSafe(todo.updated_at),
    deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : null,
  };
}
