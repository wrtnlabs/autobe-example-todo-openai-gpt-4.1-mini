import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Update an existing user
 *
 * This function updates the attributes of a todo_list_user identified by
 * userId. It validates the uniqueness of the new email if provided, updates
 * relevant fields, and returns the updated user entity. This operation is
 * restricted to admins.
 *
 * @param props - The properties for updating the user
 * @param props.admin - The admin performing the update
 * @param props.userId - UUID of the user to update
 * @param props.body - The update payload containing fields to modify
 * @returns The updated todo_list_user entity with all fields included
 * @throws {Error} If the user does not exist
 * @throws {Error} If the email is already used by another user
 */
export async function puttodoListAdminUsersUserId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
  body: ITodoListUser.IUpdate;
}): Promise<ITodoListUser> {
  const { admin, userId, body } = props;

  // Verify the target user exists and is not deleted
  const existingUser = await MyGlobal.prisma.todo_list_user.findUniqueOrThrow({
    where: { id: userId, deleted_at: null },
  });

  // Check email uniqueness excluding current user if email provided and changed
  if (body.email !== undefined && body.email !== existingUser.email) {
    const emailConflict = await MyGlobal.prisma.todo_list_user.findFirst({
      where: { email: body.email, NOT: { id: userId }, deleted_at: null },
    });
    if (emailConflict) {
      throw new Error("Email is already in use by another user");
    }
  }

  // Prepare updated_at timestamp, use body.updated_at or current time
  const now = toISOStringSafe(new Date()) as string & tags.Format<"date-time">;

  // Update the user with provided fields
  const updatedUser = await MyGlobal.prisma.todo_list_user.update({
    where: { id: userId },
    data: {
      email: body.email ?? undefined,
      password_hash: body.password_hash ?? undefined,
      updated_at: (body.updated_at ?? now) as string & tags.Format<"date-time">,
      deleted_at: body.deleted_at === undefined ? undefined : body.deleted_at,
    },
  });

  // Return the updated user with dates converted to ISO strings
  return {
    id: updatedUser.id as string & tags.Format<"uuid">,
    email: updatedUser.email,
    password_hash: updatedUser.password_hash,
    created_at: toISOStringSafe(updatedUser.created_at),
    updated_at: toISOStringSafe(updatedUser.updated_at),
    deleted_at: updatedUser.deleted_at
      ? toISOStringSafe(updatedUser.deleted_at)
      : null,
  };
}
