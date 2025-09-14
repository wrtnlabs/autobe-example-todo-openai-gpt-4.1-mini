import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Delete a todo_list_guest entity by its unique identifier.
 *
 * This is a hard delete removing the entity completely from the database.
 *
 * Only admin users are authorized to perform this action.
 *
 * @param props - The parameters including admin payload and guestId to delete
 * @param props.admin - The authenticated admin performing the deletion
 * @param props.guestId - The UUID of the guest to delete
 * @returns Void
 * @throws {Error} When the guest with the specified guestId does not exist
 */
export async function deletetodoListAdminGuestsGuestId(props: {
  admin: AdminPayload;
  guestId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { admin, guestId } = props;

  // Verify existence of the guest
  await MyGlobal.prisma.todo_list_guest.findUniqueOrThrow({
    where: {
      id: guestId,
    },
  });

  // Perform hard delete
  await MyGlobal.prisma.todo_list_guest.delete({
    where: {
      id: guestId,
    },
  });
}
