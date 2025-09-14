import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

/**
 * Refresh JWT tokens for a guest user using a valid refresh token.
 *
 * This operation allows a guest user to extend their temporary authenticated
 * session by providing a valid refresh token previously issued during guest
 * authorization.
 *
 * The system validates the token, verifies the guest record in the database,
 * and issues new JWT access and refresh tokens with appropriate expiration
 * times.
 *
 * @param props - Object containing the refresh token.
 * @param props.body - Refresh token payload for guests.
 * @returns Newly authorized guest object including tokens and timestamps.
 * @throws {Error} When the refresh token is invalid, expired, or the guest is
 *   not found.
 */
export async function postauthGuestRefresh(props: {
  body: ITodoListGuest.IRefresh;
}): Promise<ITodoListGuest.IAuthorized> {
  const { body } = props;

  // Step 1: Verify and decode the refresh token
  const decoded = jwt.verify(body.refresh_token, MyGlobal.env.JWT_SECRET_KEY, {
    issuer: "autobe",
  }) as { id: string & tags.Format<"uuid">; type: "guest" };

  // Step 2: Retrieve the guest user record from the database
  const guest = await MyGlobal.prisma.todo_list_guest.findUnique({
    where: { id: decoded.id },
  });

  if (!guest) {
    throw new Error("Guest not found");
  }

  // Step 3: Calculate token expiry timestamps
  const now = new Date();
  const accessExpiresInSeconds = 3600; // 1 hour
  const refreshExpiresInSeconds = 604800; // 7 days

  const accessExpiryDate = new Date(
    now.getTime() + accessExpiresInSeconds * 1000,
  );
  const refreshExpiryDate = new Date(
    now.getTime() + refreshExpiresInSeconds * 1000,
  );

  const accessExpiry = toISOStringSafe(accessExpiryDate);
  const refreshExpiry = toISOStringSafe(refreshExpiryDate);

  // Step 4: Generate new JWT tokens
  const accessToken = jwt.sign(
    {
      id: guest.id,
      type: "guest",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: accessExpiresInSeconds,
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: guest.id,
      type: "guest",
      token_type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: refreshExpiresInSeconds,
      issuer: "autobe",
    },
  );

  // Step 5: Return the new authorized guest payload
  return {
    id: guest.id,
    created_at: toISOStringSafe(guest.created_at),
    updated_at: toISOStringSafe(guest.updated_at),
    deleted_at: guest.deleted_at ? toISOStringSafe(guest.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpiry,
      refreshable_until: refreshExpiry,
    },
  };
}
