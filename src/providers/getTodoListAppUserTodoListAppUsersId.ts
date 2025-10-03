import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoListAppUsers";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Retrieve detailed information of a specific todo list app user account.
 *
 * This operation fetches detailed public user data (excluding sensitive
 * password hash) for the authenticated user. Only a user may retrieve their own
 * information. Attempting to access another user's data will result in a 403
 * Forbidden error.
 *
 * @param props - Object containing the authenticated user payload and the
 *   target user ID
 * @param props.user - The authenticated user requesting the data
 * @param props.id - The UUID of the user to retrieve
 * @returns The detailed user account information excluding password hash
 * @throws {HttpException} 403 if the user tries to access other user's
 *   information
 * @throws {HttpException} 404 if the user does not exist
 */
export async function getTodoListAppUserTodoListAppUsersId(props: {
  user: UserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<ITodoListAppTodoListAppUsers.ISafe> {
  const { user, id } = props;

  if (user.id !== id) {
    throw new HttpException("Forbidden: cannot access other user's data", 403);
  }

  const record = await MyGlobal.prisma.todo_list_app_users.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      email: true,
      email_verified: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  return {
    id: record.id,
    email: record.email,
    email_verified: record.email_verified,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
