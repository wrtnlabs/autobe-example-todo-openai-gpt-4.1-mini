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
 * User login for the todo_list_app_users table.
 *
 * Authenticates a user by verifying email and password. Validates that the
 * email is verified and user is not soft deleted. Returns JWT access and
 * refresh tokens upon successful login.
 *
 * @param props - Object containing user login credentials.
 * @param props.body - Login credentials including email and password.
 * @param props.user - The authenticated user payload (not used for login).
 * @returns Authorized user data with JWT tokens.
 * @throws {HttpException} 401 if credentials are invalid or user not found.
 */
export async function postAuthUserLogin(props: {
  user: UserPayload;
  body: ITodoListAppUser.ILogin;
}): Promise<ITodoListAppUser.IAuthorized> {
  const { body } = props;

  const user = await MyGlobal.prisma.todo_list_app_users.findFirst({
    where: {
      email: body.email,
      email_verified: true,
      deleted_at: null,
    },
  });

  if (!user) {
    throw new HttpException("Invalid credentials", 401);
  }

  const passwordValid = await PasswordUtil.verify(
    body.password,
    user.password_hash,
  );
  if (!passwordValid) {
    throw new HttpException("Invalid credentials", 401);
  }

  const now = toISOStringSafe(new Date());

  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  const expiredAt = toISOStringSafe(new Date(Date.now() + 3600 * 1000));
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  );

  return {
    id: user.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
