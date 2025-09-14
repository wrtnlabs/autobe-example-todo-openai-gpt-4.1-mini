import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTodo";
import { IPageITodoListTodo } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTodo";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Retrieves a paginated list of todo items owned by the authenticated user.
 *
 * Applies optional filtering by todo status and search text in title or
 * description. Results are sorted by creation timestamp descending (newest
 * first).
 *
 * @param props - The authenticated user and search criteria
 * @param props.user - Authenticated user payload
 * @param props.body - Filtering and pagination request body
 * @returns Paginated summary list of todo items
 * @throws Error if unexpected issues occur during data access
 */
export async function patchtodoListUserTodos(props: {
  user: {
    id: string & tags.Format<"uuid">;
    type: string;
  };
  body: ITodoListTodo.IRequest;
}): Promise<IPageITodoListTodo.ISummary> {
  const { user, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;
  const skip = (page - 1) * limit;

  const whereCondition = {
    todo_list_user_id: user.id,
    deleted_at: null as null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { title: { contains: body.search } },
            { description: { contains: body.search } },
          ],
        }
      : {}),
  };

  const [todos, total] = await Promise.all([
    MyGlobal.prisma.todo_list_todos.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        status: true,
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_todos.count({
      where: whereCondition,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: todos,
  };
}
