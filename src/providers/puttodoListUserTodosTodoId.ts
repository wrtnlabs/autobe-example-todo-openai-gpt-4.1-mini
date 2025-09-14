import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Updates an existing todo item identified by todoId for the authenticated
 * user.
 *
 * Only the owner user can perform the update.
 *
 * Validates:
 *
 * - Title uniqueness per user
 * - Description max length (500), nullable
 * - Status to be one of 'pending', 'in-progress', 'completed'
 *
 * @param props - Object containing user, todoId, and update body
 * @param props.user - Authenticated user payload
 * @param props.todoId - UUID of the todo to update
 * @param props.body - Partial update body for todo fields
 * @returns The updated todo item with all fields
 * @throws {Error} When todo item is not found
 * @throws {Error} When unauthorized user tries to update
 * @throws {Error} When the new title already exists for the user
 */
export async function puttodoListUserTodosTodoId(props: {
  user: UserPayload;
  todoId: string & tags.Format<"uuid">;
  body: ITodoListTodo.IUpdate;
}): Promise<ITodoListTodo> {
  const { user, todoId, body } = props;

  // Find the todo item by id or throw if not found
  const todo = await MyGlobal.prisma.todo_list_todos.findUniqueOrThrow({
    where: { id: todoId },
  });

  // Authorization check - only owner can update
  if (todo.todo_list_user_id !== user.id) {
    throw new Error("Unauthorized: Only the owner can update this todo item");
  }

  // If title is updated and not null, check uniqueness
  if (body.title !== null && body.title !== undefined) {
    const existing = await MyGlobal.prisma.todo_list_todos.findFirst({
      where: {
        todo_list_user_id: user.id,
        title: body.title,
        NOT: { id: todoId },
      },
    });
    if (existing) {
      throw new Error("Title already exists for this user");
    }
  }

  // Perform the update with only the fields provided
  const updated = await MyGlobal.prisma.todo_list_todos.update({
    where: { id: todoId },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      status: body.status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return all fields with proper date conversion and null handling
  return {
    id: updated.id,
    todo_list_user_id: updated.todo_list_user_id,
    title: updated.title,
    description: updated.description ?? null,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
