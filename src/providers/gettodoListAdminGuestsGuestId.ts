import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Retrieve detailed information of a specific todo_list_guest.
 *
 * This function fetches a single todo_list_guest entity identified by guestId.
 * It returns all fields including id, created_at, updated_at, and the nullable
 * deleted_at. Access is restricted to admins; authorization checks are assumed
 * handled by middleware.
 *
 * @param props - The parameter object containing:
 *
 *   - Admin: The authenticated admin payload.
 *   - GuestId: The UUID string identifying the guest to retrieve.
 *
 * @returns The detailed todo_list_guest entity with proper ISO string dates.
 * @throws {Error} Throws if the guest with the specified guestId does not
 *   exist.
 */
export async function gettodoListAdminGuestsGuestId(props: {
  admin: AdminPayload;
  guestId: string & tags.Format<"uuid">;
}): Promise<ITodoListGuest> {
  const { admin, guestId } = props;

  const guest = await MyGlobal.prisma.todo_list_guest.findUniqueOrThrow({
    where: {
      id: guestId,
    },
  });

  return {
    id: guest.id,
    created_at: toISOStringSafe(guest.created_at),
    updated_at: toISOStringSafe(guest.updated_at),
    deleted_at: guest.deleted_at ? toISOStringSafe(guest.deleted_at) : null,
  };
}
