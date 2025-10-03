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
 * Update details of a specific todo list app user account.
 *
 * This operation updates user-owned fields ensuring email uniqueness and proper
 * authorization.
 *
 * @param props - Object containing user auth, target id, and update data.
 * @param props.user - Authenticated user payload for ownership verification.
 * @param props.id - UUID of the user to update.
 * @param props.body - Fields to update in the user account.
 * @returns The updated user record with applied changes.
 * @throws {HttpException} 403 if unauthorized access.
 * @throws {HttpException} 404 if user not found.
 * @throws {HttpException} 409 if email already in use by another user.
 */
export async function putTodoListAppUserTodoListAppUsersId(props: {
  user: UserPayload;
  id: string & tags.Format<"uuid">;
  body: ITodoListAppTodoListAppUsers.IUpdate;
}): Promise<ITodoListAppTodoListAppUsers> {
  const { user, id, body } = props;

  // 1. Fetch the user to update and verify existence and soft deletion
  const existingUser = await MyGlobal.prisma.todo_list_app_users.findUnique({
    where: { id },
  });

  if (!existingUser || existingUser.deleted_at !== null) {
    throw new HttpException("User not found", 404);
  }

  // 2. Authorization: Only the owner user can update their own account
  if (user.id !== id) {
    throw new HttpException(
      "Unauthorized: Cannot update another user's account",
      403,
    );
  }

  // 3. Check unique email conflict if email is being updated
  if (body.email !== undefined && body.email !== existingUser.email) {
    const emailConflict = await MyGlobal.prisma.todo_list_app_users.findFirst({
      where: {
        email: body.email,
        deleted_at: null,
        // Exclude current user from conflict check
        NOT: { id },
      },
      select: { id: true },
    });
    if (emailConflict) {
      throw new HttpException("Email already in use", 409);
    }
  }

  // 4. Prepare update data inline for Prisma
  const updatedUser = await MyGlobal.prisma.todo_list_app_users.update({
    where: { id },
    data: {
      email: body.email ?? undefined,
      password_hash: body.password_hash ?? undefined,
      email_verified: body.email_verified ?? undefined,
      created_at: body.created_at
        ? toISOStringSafe(body.created_at)
        : undefined,
      updated_at: body.updated_at
        ? toISOStringSafe(body.updated_at)
        : undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
    },
  });

  // 5. Return updated record with proper date conversions
  return {
    id: updatedUser.id as string & tags.Format<"uuid">,
    email: updatedUser.email,
    password_hash: updatedUser.password_hash,
    email_verified: updatedUser.email_verified,
    created_at: toISOStringSafe(updatedUser.created_at),
    updated_at: toISOStringSafe(updatedUser.updated_at),
    deleted_at: updatedUser.deleted_at
      ? toISOStringSafe(updatedUser.deleted_at)
      : null,
  };
}
