import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Delete a todo item for a user.
 *
 * This operation permanently removes the todo item from the database. It first
 * validates that the authenticated user is the owner of the todo item. If the
 * user is not the owner, it throws an unauthorized error. Upon successful
 * authorization, it performs a hard delete, removing the todo item
 * irreversibly.
 *
 * @param props - Contains the authenticated user information, target user ID,
 *   and the todo item ID to delete.
 * @param props.user - The authenticated user performing the deletion.
 * @param props.userId - The UUID of the target user who owns the todo.
 * @param props.todoId - The UUID of the todo item to delete.
 * @throws {Error} When the todo item does not belong to the authenticated user.
 * @throws {Error} When the todo item does not exist.
 */
export async function deletetodoListUserUsersUserIdTodosTodoId(props: {
  user: UserPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
}): Promise<void> {
  const todo = await MyGlobal.prisma.todo_list_todos.findUniqueOrThrow({
    where: { id: props.todoId },
  });

  if (todo.todo_list_user_id !== props.user.id) {
    throw new Error("Unauthorized: You can only delete your own todos");
  }

  await MyGlobal.prisma.todo_list_todos.delete({
    where: { id: props.todoId },
  });
}
