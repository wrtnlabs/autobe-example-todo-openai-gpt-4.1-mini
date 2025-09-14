import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Deletes a todo item by ID.
 *
 * This endpoint allows an administrator to permanently delete a todo item from
 * the database. The operation performs a hard delete, permanently removing the
 * record. If the todo item does not exist, an error is thrown. Only users with
 * the "admin" role are authorized to perform this operation.
 *
 * @param props - Object containing admin authentication payload and the todo ID
 *   to delete
 * @param props.admin - The authenticated administrator payload
 * @param props.todoId - The UUID of the todo item to delete
 * @throws {Error} If the authenticated user is not an admin
 * @throws {Error} If the todo item does not exist
 */
export async function deletetodoListAdminTodosTodoId(props: {
  admin: AdminPayload;
  todoId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { admin, todoId } = props;

  // Retrieve the todo to verify existence
  const todo = await MyGlobal.prisma.todo_list_todos.findUniqueOrThrow({
    where: { id: todoId },
    select: { id: true, todo_list_user_id: true },
  });

  // Authorization: Only admin can delete todos
  if (admin.type !== "admin") {
    throw new Error("Unauthorized: Only admin can delete todos");
  }

  // Perform hard delete (permanent removal)
  await MyGlobal.prisma.todo_list_todos.delete({
    where: { id: todoId },
  });
}
