import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Refresh JWT token for user role 'user'.
 *
 * This function validates the provided refresh token, ensures the user is valid
 * and not soft deleted, and returns a new access and refresh token set. All
 * datetime values are ISO 8601 strings formatted with typia tags.
 *
 * @param props - Object containing user payload and refresh token body
 * @param props.user - The authenticated user payload
 * @param props.body - The refresh token request body containing the
 *   refresh_token string
 * @returns Authorized user info including new JWT tokens
 * @throws {Error} Throws when token verification fails, token type mismatch, or
 *   user not found
 */
export async function postauthUserRefresh(props: {
  user: UserPayload;
  body: ITodoListUser.IRefresh;
}): Promise<ITodoListUser.IAuthorized> {
  const { body } = props;

  // Validate the refresh token with jwt.verify
  const decoded = jwt.verify(body.refresh_token, MyGlobal.env.JWT_SECRET_KEY, {
    issuer: "autobe",
  }) as { id: string & tags.Format<"uuid">; type: "user"; exp: number };

  if (decoded.type !== "user") {
    throw new Error("Invalid token type");
  }

  // Lookup the user in the database
  const user = await MyGlobal.prisma.todo_list_user.findFirst({
    where: { id: decoded.id, deleted_at: null },
  });

  if (!user) {
    throw new Error("User not found or deleted");
  }

  // Prepare expiration ISO timestamps
  const accessTokenExpiresAt = toISOStringSafe(
    new Date(Date.now() + 3600 * 1000),
  ); // 1 hour
  const refreshTokenExpiresAt = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  ); // 7 days

  // Generate new access token
  const accessToken = jwt.sign(
    { id: user.id, type: "user" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  // Generate new refresh token
  const refreshToken = jwt.sign(
    { id: user.id, type: "user" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  // Return authorized response
  return {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessTokenExpiresAt,
      refreshable_until: refreshTokenExpiresAt,
    },
  };
}
