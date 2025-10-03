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
 * Registers a new user account for the 'user' role in the todoListApp backend.
 *
 * This endpoint allows public user registration by creating a new user record
 * with hashed password and unverified email status. Upon successful creation,
 * it generates JWT access and refresh tokens for immediate authenticated
 * usage.
 *
 * @param props - Object containing the user registration data.
 * @param props.body - User creation data including email and plain password.
 * @returns The authorized user data containing user ID and JWT tokens.
 * @throws {HttpException} When user creation fails (e.g., duplicate email).
 */
export async function postAuthUserJoin(props: {
  body: ITodoListAppUser.ICreate;
}): Promise<ITodoListAppUser.IAuthorized> {
  const { body } = props;

  // Hash the password
  const hashedPassword = await PasswordUtil.hash(body.password_hash);

  // Prepare timestamps as ISO strings
  const now = toISOStringSafe(new Date());

  // Generate new user ID as UUID v4
  const newUserId = v4() as string & tags.Format<"uuid">;

  // Create new user in database
  const newUser = await MyGlobal.prisma.todo_list_app_users.create({
    data: {
      id: newUserId,
      email: body.email,
      password_hash: hashedPassword,
      email_verified: false,
      created_at: now,
      updated_at: now,
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Prepare JWT tokens
  const accessToken = jwt.sign(
    {
      userId: newUser.id,
      email: newUser.email,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: newUser.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Calculate expiration ISO strings
  const expiredAt = toISOStringSafe(new Date(Date.now() + 3600 * 1000)); // 1 hour later
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  ); // 7 days later

  // Return authorized user data
  return {
    id: newUser.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
