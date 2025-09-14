import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { IPageITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodos";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Retrieves a paginated list of todo items for a specific user.
 *
 * This operation supports filtering by status, searching by title or
 * description, sorting by creation or update timestamps, and pagination.
 *
 * Only the authenticated user can retrieve their own todos.
 *
 * @param props - Object containing authenticated user, target userId, and
 *   search/pagination parameters
 * @returns Paginated list of todo items conforming to IPageITodoListTodos
 * @throws {Error} When unauthorized access is detected
 */
export async function patchtodoListUserUsersUserIdTodos(props: {
  user: UserPayload;
  userId: string & tags.Format<"uuid">;
  body: ITodoListTodos.IRequest;
}): Promise<IPageITodoListTodos> {
  const { user, userId, body } = props;

  // Authorization check: user.id must match userId
  if (user.id !== userId) {
    throw new Error("Unauthorized: cannot access other users' todos");
  }

  const page = (body.page ?? 1) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;
  const limit = (body.limit ?? 100) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;
  const skip = (page - 1) * limit;

  // Build where condition for Prisma query
  const whereCondition = {
    todo_list_user_id: userId,
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined && body.search !== null && body.search !== ""
      ? {
          OR: [
            { title: { contains: body.search } },
            { description: { contains: body.search } },
          ],
        }
      : {}),
  };

  // Determine orderBy field
  const orderBy =
    body.orderBy === "created_at" || body.orderBy === "updated_at"
      ? { [body.orderBy]: "desc" as const }
      : { created_at: "desc" as const };

  // Query data and count in parallel
  const [todos, total] = await Promise.all([
    MyGlobal.prisma.todo_list_todos.findMany({
      where: whereCondition,
      orderBy: orderBy,
      skip: skip,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_todos.count({
      where: whereCondition,
    }),
  ]);

  // Transform results
  const data = todos.map((todo) => ({
    id: todo.id,
    todo_list_user_id: todo.todo_list_user_id,
    title: todo.title,
    description: todo.description ?? null,
    status: todo.status as "pending" | "in-progress" | "completed",
    created_at: toISOStringSafe(todo.created_at),
    updated_at: toISOStringSafe(todo.updated_at),
    deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : null,
  }));

  // Calculate pagination pages count
  const pages = Math.ceil(total / limit);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: pages,
    },
    data: data,
  };
}
