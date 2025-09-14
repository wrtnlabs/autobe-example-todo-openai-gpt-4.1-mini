import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Retrieves a specific todo item by its ID for a specified user.
 *
 * Access is restricted to the owner user.
 *
 * @param props - Object containing user payload, userId, and todoId
 * @param props.user - Authenticated user making the request
 * @param props.userId - UUID of the user who owns the todo
 * @param props.todoId - UUID of the todo item to retrieve
 * @returns The detailed todo item
 * @throws {Error} If the user is unauthorized or the todo is not found
 */
export async function gettodoListUserUsersUserIdTodosTodoId(props: {
  user: UserPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
}): Promise<ITodoListTodos> {
  const { user, userId, todoId } = props;

  if (user.id !== userId) {
    throw new Error("Unauthorized: You can only access your own todos.");
  }

  const todo = await MyGlobal.prisma.todo_list_todos.findFirst({
    where: { id: todoId, todo_list_user_id: userId, deleted_at: null },
  });

  if (!todo) {
    throw new Error("Todo not found");
  }

  return {
    id: todo.id,
    todo_list_user_id: todo.todo_list_user_id,
    title: todo.title,
    description: todo.description ?? undefined,
    status: todo.status,
    created_at: toISOStringSafe(todo.created_at),
    updated_at: toISOStringSafe(todo.updated_at),
    deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : undefined,
  };
}
