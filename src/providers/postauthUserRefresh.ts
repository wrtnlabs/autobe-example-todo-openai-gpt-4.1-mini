import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Refresh JWT token for todoListApp user using a valid refresh token.
 *
 * Validates the provided refresh token, verifies user existence with confirmed
 * email and no deletion, and issues new JWT access and refresh tokens.
 *
 * @param props - Object containing the authenticated user and the body with
 *   refresh token.
 * @param props.user - The authenticated user payload (not used for
 *   authorization here).
 * @param props.body - The request body containing the refresh token.
 * @returns The authorized user information with new tokens.
 * @throws HttpException(401) When the refresh token is invalid, expired, or
 *   user not found.
 */
export async function postAuthUserRefresh(props: {
  user: UserPayload;
  body: ITodoListAppUser.IRefresh;
}): Promise<ITodoListAppUser.IAuthorized> {
  const { body } = props;

  let decoded: any;
  try {
    decoded = jwt.verify(body.refreshToken, MyGlobal.env.JWT_SECRET_KEY, {
      issuer: "autobe",
    });
  } catch {
    throw new HttpException(
      "Unauthorized: Invalid or expired refresh token",
      401,
    );
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.id !== "string"
  ) {
    throw new HttpException("Unauthorized: Invalid token payload", 401);
  }

  const user = await MyGlobal.prisma.todo_list_app_users.findFirst({
    where: {
      id: decoded.id,
      email_verified: true,
      deleted_at: null,
    },
  });

  if (!user) {
    throw new HttpException("Unauthorized: User not found or inactive", 401);
  }

  // Define expiration times for tokens
  const now = new Date();
  const accessTokenExpiresIn = 60 * 60; // 1 hour in seconds
  const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  const accessTokenExp = new Date(now.getTime() + accessTokenExpiresIn * 1000);
  const refreshTokenExp = new Date(
    now.getTime() + refreshTokenExpiresIn * 1000,
  );

  // Convert to ISO strings with tags, no Date usage in properties
  const accessExpiredAt = accessTokenExp.toISOString() as string &
    tags.Format<"date-time">;
  const refreshExpiredAt = refreshTokenExp.toISOString() as string &
    tags.Format<"date-time">;

  // Create JWT tokens
  const accessToken = jwt.sign(
    { id: user.id, type: "user" },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: accessTokenExpiresIn,
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    { id: user.id, tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: refreshTokenExpiresIn,
      issuer: "autobe",
    },
  );

  return {
    id: user.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpiredAt,
      refreshable_until: refreshExpiredAt,
    },
  };
}
