import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Update a todo item for a user.
 *
 * This operation updates the title, description, and status of a todo item. It
 * ensures the title is unique per user, non-empty, and respects max length
 * rules. Description length is validated implicitly by the API validator.
 * Status must be one of 'pending', 'in-progress', or 'completed'.
 *
 * Access control is enforced to allow only the todo owner or an admin to
 * perform updates.
 *
 * @param props - Properties including admin for auth, userId and todoId path
 *   params, and update body.
 * @returns The updated todo item with all fields and properly formatted date
 *   strings.
 * @throws {Error} When the todo item does not exist or does not belong to the
 *   user.
 * @throws {Error} When the new title conflicts with another todo of the same
 *   user.
 */
export async function puttodoListAdminUsersUserIdTodosTodoId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
  body: ITodoListTodos.IUpdate;
}): Promise<ITodoListTodos> {
  const { admin, userId, todoId, body } = props;

  // Find the todo item by ID
  const todo = await MyGlobal.prisma.todo_list_todos.findUnique({
    where: { id: todoId },
  });

  if (!todo) throw new Error(`Todo item with id ${todoId} not found.`);

  // Enforce ownership: todo_list_user_id must match the provided userId
  if (todo.todo_list_user_id !== userId) {
    throw new Error(`Unauthorized: todo does not belong to user ${userId}`);
  }

  // Validate title uniqueness if title is updated
  if (body.title !== undefined) {
    const existingTodo = await MyGlobal.prisma.todo_list_todos.findFirst({
      where: {
        todo_list_user_id: userId,
        title: body.title,
        id: { not: todoId },
      },
      select: { id: true },
    });

    if (existingTodo) {
      throw new Error(
        `Title '${body.title}' already exists for user ${userId}`,
      );
    }
  }

  // Prepare updated_at timestamp
  const now = toISOStringSafe(new Date()) as string & tags.Format<"date-time">;

  // Perform the update operation
  const updated = await MyGlobal.prisma.todo_list_todos.update({
    where: { id: todoId },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      status: body.status ?? undefined,
      updated_at: now,
    },
  });

  // Return the updated todo item with correctly formatted dates
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
