import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Deletes a todo item permanently from the database for a specified user.
 *
 * This operation requires that the caller is an administrator and that the todo
 * item belongs to the specified user.
 *
 * Upon successful invocation, the todo item is permanently removed and cannot
 * be retrieved.
 *
 * @param props - Object containing admin authentication info and route
 *   parameters
 * @param props.admin - Authenticated administrator performing the deletion
 * @param props.userId - UUID of the user who owns the todo
 * @param props.todoId - UUID of the todo item to be deleted
 * @throws {Error} If the todo item does not belong to the specified user
 * @throws {Error} If the todo item is not found
 */
export async function deletetodoListAdminUsersUserIdTodosTodoId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { admin, userId, todoId } = props;

  // Retrieve the todo item, throw if not found
  const todo = await MyGlobal.prisma.todo_list_todos.findUniqueOrThrow({
    where: { id: todoId },
  });

  // Verify that the todo belongs to the specified user
  if (todo.todo_list_user_id !== userId) {
    throw new Error("Unauthorized: You must be the owner user or an admin");
  }

  // Permanently delete the todo item
  await MyGlobal.prisma.todo_list_todos.delete({ where: { id: todoId } });
}
