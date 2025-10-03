import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoListAppUsers";
import { IPageITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListAppTodoListAppUsers";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Search and retrieve a filtered, paginated list of todo list app users.
 *
 * This endpoint supports optional filtering by email substring and email
 * verification status. Supports pagination with page and limit parameters, and
 * sorting by email or created_at. Soft-deleted users (deleted_at not null) are
 * excluded.
 *
 * @param props - The request properties containing the authenticated user and
 *   search filters.
 * @param props.user - The authenticated user making the request.
 * @param props.body - The filter and pagination criteria.
 * @returns A paginated summary list of todo list app users matching the search
 *   criteria.
 * @throws {HttpException} Throws if unexpected database errors occur.
 */
export async function patchTodoListAppUserTodoListAppUsers(props: {
  user: UserPayload;
  body: ITodoListAppTodoListAppUsers.IRequest;
}): Promise<IPageITodoListAppTodoListAppUsers.ISummary> {
  const { body } = props;

  // Normalize pagination parameters with sensible defaults
  const page = (body.page ?? 1) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;
  const limit = (body.limit ?? 10) as number &
    tags.Type<"int32"> &
    tags.Minimum<0> as number;
  const skip = (page - 1) * limit;

  // Build the filtering conditions
  const where: Prisma.todo_list_app_usersWhereInput = {
    deleted_at: null,
    ...(body.search !== undefined &&
      body.search !== null && {
        email: { contains: body.search },
      }),
    ...(body.email_verified !== undefined &&
      body.email_verified !== null && {
        email_verified: body.email_verified,
      }),
  };

  // Determine sort field and order
  const validSortFields = new Set(["email", "created_at"]);
  const sortField =
    body.sort_by && validSortFields.has(body.sort_by)
      ? body.sort_by
      : "created_at";
  const sortOrder = body.order === "asc" ? "asc" : "desc";

  // Query the filtered, paginated list and total count concurrently
  const [results, total] = await Promise.all([
    MyGlobal.prisma.todo_list_app_users.findMany({
      where,
      select: {
        id: true,
        email: true,
        email_verified: true,
        created_at: true,
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_app_users.count({ where }),
  ]);

  // Map results to response format, converting dates properly
  const data = results.map((user) => ({
    id: user.id as string & tags.Format<"uuid">,
    email: user.email,
    email_verified: user.email_verified,
    created_at: toISOStringSafe(user.created_at),
  }));

  // Construct pagination metadata
  const paginated = {
    current: Number(page),
    limit: Number(limit),
    records: total,
    pages: Math.ceil(total / limit),
  };

  return {
    pagination: paginated,
    data,
  };
}
