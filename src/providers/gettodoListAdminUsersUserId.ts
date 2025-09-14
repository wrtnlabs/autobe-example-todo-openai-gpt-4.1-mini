import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieves detailed information of a specific authenticated user identified by
 * their userId.
 *
 * This operation is restricted to users with 'admin' role. It fetches the user
 * from the database by userId and returns all relevant fields.
 *
 * @param props - Object containing admin authentication and userId parameter
 * @param props.admin - The authenticated admin making the request
 * @param props.userId - UUID string identifying the target user
 * @returns The detailed user information matching the given userId
 * @throws {Error} If the user with given userId does not exist
 */
export async function gettodoListAdminUsersUserId(props: {
  admin: AdminPayload;
  userId: string & tags.Format<"uuid">;
}): Promise<ITodoListUser> {
  const { userId } = props;

  const user = await MyGlobal.prisma.todo_list_user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password_hash: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
  };
}
