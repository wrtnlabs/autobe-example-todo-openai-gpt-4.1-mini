import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Permanently deletes the user account specified by the given UUID id.
 *
 * This operation verifies that the requester is the owner of the account before
 * proceeding. If the user does not exist, a 404 error is thrown. If the
 * requester is not the owner, a 403 error is thrown.
 *
 * @param props - Parameters
 * @param props.user - The authenticated user requesting the deletion
 * @param props.id - The UUID of the user account to delete
 * @throws {HttpException} 404 if the user does not exist
 * @throws {HttpException} 403 if unauthorized user attempts deletion
 */
export async function deleteTodoListAppUserTodoListAppUsersId(props: {
  user: UserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const userRecord = await MyGlobal.prisma.todo_list_app_users.findUnique({
    where: { id: props.id },
  });

  if (!userRecord) {
    throw new HttpException("User not found", 404);
  }

  if (userRecord.id !== props.user.id) {
    throw new HttpException(
      "Unauthorized: You can only delete your own account",
      403,
    );
  }

  await MyGlobal.prisma.todo_list_app_users.delete({
    where: { id: props.id },
  });
}
