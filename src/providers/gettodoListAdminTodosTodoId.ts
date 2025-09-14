import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieve detailed information about a single todo item by ID.
 *
 * This function fetches a todo item from the database where the ID matches the
 * given todoId and the item has not been soft-deleted (deleted_at is null).
 *
 * Only authenticated admin users can perform this operation.
 *
 * @param props - Object containing admin authentication and todoId path
 *   parameter
 * @param props.admin - Authenticated admin user performing the operation
 * @param props.todoId - UUID of the todo item to retrieve
 * @returns The todo item with all its relevant fields
 * @throws {Error} Throws if the todo item does not exist or is soft-deleted
 */
export async function gettodoListAdminTodosTodoId(props: {
  admin: AdminPayload;
  todoId: string & tags.Format<"uuid">;
}): Promise<ITodoListTodo> {
  const { admin, todoId } = props;

  const todo = await MyGlobal.prisma.todo_list_todos.findFirstOrThrow({
    where: {
      id: todoId,
      deleted_at: null,
    },
  });

  return {
    id: todo.id,
    todo_list_user_id: todo.todo_list_user_id,
    title: todo.title,
    description: todo.description ?? undefined,
    status: todo.status,
    created_at: toISOStringSafe(todo.created_at),
    updated_at: toISOStringSafe(todo.updated_at),
    deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : null,
  };
}
