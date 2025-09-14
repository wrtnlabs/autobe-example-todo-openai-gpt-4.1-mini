import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Soft delete a user by setting the deleted_at timestamp to mark as deleted.
 *
 * This function verifies that the user exists and is not already deleted. Only
 * an admin may perform this operation. If the user does not exist or is already
 * deleted, an error is thrown.
 *
 * @param props - Object containing admin authentication and target userId
 * @param props.admin - The authenticated admin user making the request
 * @param props.userId - UUID of the user to soft delete
 * @throws {Error} Throws if user not found or already deleted
 */
export async function deletetodoListAdminUsersUserId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { admin, userId } = props;

  // Confirm the user exists and is not already soft deleted
  const user = await MyGlobal.prisma.todo_list_user.findFirst({
    where: {
      id: userId,
      deleted_at: null,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = toISOStringSafe(new Date());

  // Perform soft delete by setting the deleted_at timestamp
  await MyGlobal.prisma.todo_list_user.update({
    where: { id: userId },
    data: {
      deleted_at: now,
      updated_at: now,
    },
  });
}
