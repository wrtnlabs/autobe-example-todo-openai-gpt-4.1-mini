import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

/**
 * Creates a temporary guest account with JWT tokens for limited access.
 *
 * This operation creates a new guest record in the todo_list_guest table, which
 * represents unauthenticated users with minimal permissions. It generates UUID
 * for the guest, sets created_at and updated_at timestamps, and initializes
 * deleted_at as null to indicate the account is active.
 *
 * After creation, it generates JWT access and refresh tokens with appropriate
 * expiration times and issuer field.
 *
 * The response returns the guest's public identification and authorization
 * token information for temporary access.
 *
 * This endpoint is publicly accessible without requiring any authentication.
 *
 * @returns {Promise<ITodoListGuest.IAuthorized>} The authorized guest data
 *   including JWT tokens.
 * @throws {Error} Throws error if creation of the guest record or token
 *   generation fails.
 */
export async function postauthGuestJoin(): Promise<ITodoListGuest.IAuthorized> {
  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  // Create guest record
  const created = await MyGlobal.prisma.todo_list_guest.create({
    data: {
      id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Generate expiration timestamps as ISO strings
  const accessExpire = toISOStringSafe(new Date(Date.now() + 3600 * 1000));
  const refreshExpire = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  );

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      id: created.id,
      type: "guest",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: created.id,
      type: "guest",
      token_type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  return {
    id: created.id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpire,
      refreshable_until: refreshExpire,
    },
  };
}
