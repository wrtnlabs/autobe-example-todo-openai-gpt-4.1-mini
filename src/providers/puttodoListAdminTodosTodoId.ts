import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Updates an existing todo item by ID.
 *
 * Only accessible by an admin user, this operation updates the todo item
 * identified by the provided `todoId`. It validates that the title remains
 * unique for the owner user and applies updates to title, description, and
 * status.
 *
 * @param props - Object containing admin authentication, todoId, and update
 *   body
 * @param props.admin - Authenticated admin user performing the operation
 * @param props.todoId - UUID of the todo item to update
 * @param props.body - Partial update payload with title, description, and
 *   status
 * @returns The updated todo item
 * @throws {Error} If the todo item does not exist
 * @throws {Error} If the title is not unique for the user
 */
export async function puttodoListAdminTodosTodoId(props: {
  admin: AdminPayload;
  todoId: string & tags.Format<"uuid">;
  body: ITodoListTodo.IUpdate;
}): Promise<ITodoListTodo> {
  const { admin, todoId, body } = props;

  // Find the todo by ID
  const foundTodo = await MyGlobal.prisma.todo_list_todos.findUnique({
    where: { id: todoId },
  });

  if (!foundTodo) {
    throw new Error("Todo not found");
  }

  // Authorization is assumed satisfied by admin presence

  // Validate title uniqueness if title provided
  if (body.title !== undefined && body.title !== null) {
    const existingTodo = await MyGlobal.prisma.todo_list_todos.findFirst({
      where: {
        todo_list_user_id: foundTodo.todo_list_user_id,
        title: body.title,
        id: { not: todoId },
      },
    });

    if (existingTodo) {
      throw new Error("Title must be unique per user");
    }
  }

  // Prepare updated_at timestamp
  const now = toISOStringSafe(new Date());

  // Perform update
  const updated = await MyGlobal.prisma.todo_list_todos.update({
    where: { id: todoId },
    data: {
      title: body.title === null ? undefined : (body.title ?? undefined),
      description: body.description ?? undefined,
      status: body.status === null ? undefined : (body.status ?? undefined),
      updated_at: now,
    },
  });

  // Return updated todo with proper date formatting
  return {
    id: updated.id as string & tags.Format<"uuid">,
    todo_list_user_id: updated.todo_list_user_id as string &
      tags.Format<"uuid">,
    title: updated.title,
    description: updated.description ?? null,
    status: updated.status as "pending" | "in-progress" | "completed",
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
