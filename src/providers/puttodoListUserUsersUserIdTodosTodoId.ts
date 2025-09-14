import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Updates an existing todo item of the authenticated user.
 *
 * This operation validates ownership, enforces title uniqueness per user, and
 * ensures all data constraints are met before updating.
 *
 * @param props - Object containing user authentication payload, target userId,
 *   todoId, and update data.
 * @returns Updated todo item information conforming to ITodoListTodos.
 * @throws {Error} Unauthorized access if user tries to update others' todos.
 * @throws {Error} Validation errors for title uniqueness, length, and status
 *   correctness.
 * @throws {Error} If the target todo does not exist.
 */
export async function puttodoListUserUsersUserIdTodosTodoId(props: {
  user: UserPayload;
  userId: string & tags.Format<"uuid">;
  todoId: string & tags.Format<"uuid">;
  body: ITodoListTodos.IUpdate;
}): Promise<ITodoListTodos> {
  const { user, userId, todoId, body } = props;

  if (user.id !== userId) {
    throw new Error(
      "Unauthorized: You can only update todos for your own user account",
    );
  }

  const todo = await MyGlobal.prisma.todo_list_todos.findUnique({
    where: { id: todoId },
  });
  if (!todo) {
    throw new Error("Todo not found");
  }

  if (todo.todo_list_user_id !== user.id) {
    throw new Error("Unauthorized: You can only update your own todos");
  }

  if (body.title !== undefined) {
    if (body.title.length === 0) {
      throw new Error("Title must not be empty");
    }
    if (body.title.length > 100) {
      throw new Error("Title must be at most 100 characters long");
    }

    const existing = await MyGlobal.prisma.todo_list_todos.findFirst({
      where: {
        todo_list_user_id: user.id,
        title: body.title,
        id: { not: todoId },
        deleted_at: null,
      },
    });
    if (existing) {
      throw new Error("Title must be unique per user");
    }
  }

  if (body.status !== undefined) {
    if (!["pending", "in-progress", "completed"].includes(body.status)) {
      throw new Error("Invalid status value");
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (body.description.length > 500) {
      throw new Error("Description must be at most 500 characters long");
    }
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.todo_list_todos.update({
    where: { id: todoId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      description:
        body.description === undefined ? todo.description : body.description,
      ...(body.status !== undefined ? { status: body.status } : {}),
      updated_at: now,
    },
  });

  return {
    id: updated.id as string & tags.Format<"uuid">,
    todo_list_user_id: updated.todo_list_user_id as string &
      tags.Format<"uuid">,
    title: updated.title,
    description: updated.description ?? null,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
