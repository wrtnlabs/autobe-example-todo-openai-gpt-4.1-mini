import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Deletes a todo item by its unique ID.
 *
 * This operation permanently removes the todo_list_todos record from the
 * database. Only the owner user is authorized to perform the deletion.
 *
 * @param props - Contains the authenticated user payload and the todo item's
 *   UUID.
 * @param props.user - The authenticated user attempting to delete the todo.
 * @param props.todoId - The UUID of the todo item to delete.
 * @throws {Error} Throws if the todo does not exist.
 * @throws {Error} Throws if the user is not authorized to delete the todo.
 */
export async function deletetodoListUserTodosTodoId(props: {
  user: UserPayload;
  todoId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { user, todoId } = props;

  const todo = await MyGlobal.prisma.todo_list_todos.findUnique({
    where: { id: todoId },
    select: { id: true, todo_list_user_id: true },
  });

  if (!todo) throw new Error("Todo not found");

  if (todo.todo_list_user_id !== user.id) {
    throw new Error("Unauthorized");
  }

  await MyGlobal.prisma.todo_list_todos.delete({ where: { id: todoId } });
}
