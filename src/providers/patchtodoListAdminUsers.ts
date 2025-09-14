import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { IPageITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListUser";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieves a paginated and filterable list of authenticated users
 * (todo_list_user entities).
 *
 * This operation supports filtering by email substring, created_at ranges,
 * pagination controls, and sorting by created_at or updated_at in ascending or
 * descending order.
 *
 * Access is restricted to authorized admin users.
 *
 * @param props - Object containing authenticated admin payload and filtering
 *   parameters.
 * @param props.admin - The authenticated admin making the request.
 * @param props.body - Filtering, sorting, and pagination request parameters.
 * @returns A paginated summary list of authenticated users.
 * @throws Error if database operation fails or unauthorized access occurs.
 */
export async function patchtodoListAdminUsers(props: {
  admin: AdminPayload;
  body: ITodoListUser.IRequest;
}): Promise<IPageITodoListUser.ISummary> {
  const { admin, body } = props;

  // Coerce page and limit for pagination with stable defaults
  const page = (body.page ?? 1) as number & tags.Type<"int32"> as number;
  const limit = (body.limit ?? 10) as number & tags.Type<"int32"> as number;

  // Build where filter condition considering optional filters with null checks
  const where = {
    deleted_at: null,
    ...(body.emailContains !== undefined &&
      body.emailContains !== null && {
        email: { contains: body.emailContains },
      }),
    ...(((body.createdAfter !== undefined && body.createdAfter !== null) ||
      (body.createdBefore !== undefined && body.createdBefore !== null)) && {
      created_at: {
        ...(body.createdAfter !== undefined &&
          body.createdAfter !== null && {
            gte: body.createdAfter,
          }),
        ...(body.createdBefore !== undefined &&
          body.createdBefore !== null && {
            lte: body.createdBefore,
          }),
      },
    }),
  };

  // Determine orderBy criteria; default to created_at desc
  const orderField =
    body.sortBy === "created_at" || body.sortBy === "updated_at"
      ? body.sortBy
      : "created_at";
  const orderDirection =
    body.sortDirection === "asc" || body.sortDirection === "desc"
      ? body.sortDirection
      : "desc";

  // Execute parallel queries: filtered users list and count
  const [users, total] = await Promise.all([
    MyGlobal.prisma.todo_list_user.findMany({
      where,
      select: {
        id: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        [orderField]: orderDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_user.count({ where }),
  ]);

  // Map prisma results to DTO summary structure with date conversions
  const data = users.map((user) => ({
    id: user.id as string & tags.Format<"uuid">,
    email: user.email as string & tags.Format<"email">,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
  }));

  // Construct pagination information with number coercion
  const pagination = {
    current: Number(page),
    limit: Number(limit),
    records: total,
    pages: Math.ceil(total / limit),
  } satisfies IPageITodoListUser.ISummary["pagination"];

  return {
    pagination,
    data,
  };
}
