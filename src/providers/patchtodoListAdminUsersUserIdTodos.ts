import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodos";
import { IPageITodoListTodos } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodos";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieves a paginated list of todo items belonging to a specific user, with
 * support for filtering by status, search, sorting, and pagination.
 *
 * Only accessible by an authenticated admin user. Throws error if the user does
 * not exist.
 *
 * @param props - Object containing admin caller info, target userId, and
 *   request filter parameters
 * @param props.admin - Authenticated admin payload
 * @param props.userId - UUID of the target user to fetch todos for
 * @param props.body - Request parameters for filtering, searching, sorting, and
 *   pagination
 * @returns Paginated list of todo items matching the criteria
 * @throws {Error} When the target user does not exist
 */
export async function patchtodoListAdminUsersUserIdTodos(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
  body: ITodoListTodos.IRequest;
}): Promise<IPageITodoListTodos> {
  const { admin, userId, body } = props;

  const page = (body.page ?? 1) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;
  const limit = (body.limit ?? 100) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;

  // Verify that the user exists
  const user = await MyGlobal.prisma.todo_list_user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");

  // Build the where condition with filters
  const whereCondition = {
    todo_list_user_id: userId,
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined &&
      body.search !== null && { title: { contains: body.search } }),
  };

  // Execute queries for pagination and data retrieval
  const [todos, total] = await Promise.all([
    MyGlobal.prisma.todo_list_todos.findMany({
      where: whereCondition,
      orderBy:
        body.orderBy && typeof body.orderBy === "string"
          ? (() => {
              const parts = body.orderBy.trim().split(/\s+/);
              const field = parts[0];
              const dir = parts[1]?.toLowerCase() === "asc" ? "asc" : "desc";
              // Allowed fields for ordering
              const allowedFields = [
                "created_at",
                "updated_at",
                "title",
                "status",
              ];
              if (allowedFields.includes(field)) {
                return { [field]: dir };
              }
              return { created_at: "desc" };
            })()
          : { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_todos.count({ where: whereCondition }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: todos.map((todo) => ({
      id: todo.id as string & tags.Format<"uuid">,
      todo_list_user_id: todo.todo_list_user_id as string & tags.Format<"uuid">,
      title: todo.title,
      description: todo.description ?? null,
      status: todo.status as "pending" | "in-progress" | "completed",
      created_at: toISOStringSafe(todo.created_at),
      updated_at: toISOStringSafe(todo.updated_at),
      deleted_at: todo.deleted_at ? toISOStringSafe(todo.deleted_at) : null,
    })),
  };
}
