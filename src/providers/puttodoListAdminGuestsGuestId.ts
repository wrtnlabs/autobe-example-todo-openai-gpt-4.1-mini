import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Update an existing todo_list_guest entity.
 *
 * Only authorized admin users can perform this operation. This function updates
 * the fields provided in the request body for the guest identified by guestId.
 *
 * @param props - The properties including admin payload, guestId, and update
 *   body
 * @param props.admin - Authenticated admin executing the update
 * @param props.guestId - UUID of the guest record to update
 * @param props.body - Update data conforming to ITodoListGuest.IUpdate
 * @returns The updated todo_list_guest entity
 * @throws {Error} Throws if guest not found or update operation fails
 */
export async function puttodoListAdminGuestsGuestId(props: {
  admin: AdminPayload;
  guestId: string & tags.Format<"uuid">;
  body: ITodoListGuest.IUpdate;
}): Promise<ITodoListGuest> {
  const { admin, guestId, body } = props;

  // Verify existence and authorization
  await MyGlobal.prisma.todo_list_guest.findUniqueOrThrow({
    where: { id: guestId },
  });

  // Update fields conditionally based on provided properties
  const updated = await MyGlobal.prisma.todo_list_guest.update({
    where: { id: guestId },
    data: {
      created_at: body.created_at ?? undefined,
      updated_at: body.updated_at ?? undefined,
      deleted_at: body.deleted_at !== undefined ? body.deleted_at : undefined,
    },
  });

  return {
    id: updated.id,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    deleted_at: updated.deleted_at ?? null,
  };
}
