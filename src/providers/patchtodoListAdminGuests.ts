import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";
import { IPageITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListGuest";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieve a filtered and paginated list of todo_list_guest entities.
 *
 * This operation allows administrators to query guests created in the system,
 * including their creation, update times, and deletion status.
 *
 * @param props - Object containing the authenticated admin payload and request
 *   filter.
 * @param props.admin - The authenticated admin making the request.
 * @param props.body - Request body including pagination parameters.
 * @returns Paginated list of todo_list_guest entities.
 * @throws {Error} If pagination parameters are invalid or database errors
 *   occur.
 */
export async function patchtodoListAdminGuests(props: {
  admin: AdminPayload;
  body: ITodoListGuest.IRequest;
}): Promise<IPageITodoListGuest> {
  const { admin, body } = props;

  // Apply default pagination parameters
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  if (page <= 0) {
    throw new Error(
      "Invalid pagination parameter: page must be greater than zero.",
    );
  }

  if (limit <= 0) {
    throw new Error(
      "Invalid pagination parameter: limit must be greater than zero.",
    );
  }

  const skip = (page - 1) * limit;

  const [guests, total] = await Promise.all([
    MyGlobal.prisma.todo_list_guest.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_guest.count({
      where: {
        deleted_at: null,
      },
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: guests.map((guest) => ({
      id: guest.id,
      created_at: toISOStringSafe(guest.created_at),
      updated_at: toISOStringSafe(guest.updated_at),
      deleted_at: guest.deleted_at ? toISOStringSafe(guest.deleted_at) : null,
    })),
  };
}
