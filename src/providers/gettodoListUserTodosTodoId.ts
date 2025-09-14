import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Retrieves detailed information of a specific todo item for the authenticated
 * user.
 *
 * This function fetches the todo item by its unique identifier (todoId) from
 * the todo_list_todos table, ensuring that the requesting user owns the todo.
 * It excludes soft-deleted todos (deleted_at is null).
 *
 * Access control is enforced by filtering todos by the user's ID.
 *
 * @param props - Object containing the authenticated user and the todo ID.
 * @param props.user - The authenticated user requesting the todo details.
 * @param props.todoId - The UUID of the todo item to retrieve.
 * @returns The detailed todo item matching the todoId and user ownership.
 * @throws {Error} Throws if the todo item is not found or the user is not
 *   authorized.
 */
export async function gettodoListUserTodosTodoId(props: {
  user: UserPayload;
  todoId: string & tags.Format<"uuid">;
}): Promise<ITodoListTodo> {
  const { user, todoId } = props;

  const todo = await MyGlobal.prisma.todo_list_todos.findFirstOrThrow({
    where: {
      id: todoId,
      todo_list_user_id: user.id,
      deleted_at: null,
    },
  });

  typia.assertGuard<"pending" | "in-progress" | "completed">(todo.status);

  return {
    id: todo.id,
    todo_list_user_id: todo.todo_list_user_id,
    title: todo.title,
    description: todo.description ?? null,
    status: todo.status,
    created_at: toISOStringSafe(todo.created_at),
    updated_at: toISOStringSafe(todo.updated_at),
    deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : null,
  };
}
