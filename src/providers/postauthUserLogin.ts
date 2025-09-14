import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Login operation for todo_list_user role issuing access tokens after
 * successful authentication.
 *
 * Allows users to log in using email and password. Validates credentials
 * against todo_list_user table. Returns authorized tokens including access and
 * refresh JWT tokens.
 *
 * @param props - Object containing user payload (unused) and login body.
 * @param props.user - UserPayload, present by convention but unused in login.
 * @param props.body - ITodoListUser.ILogin containing login credentials.
 * @returns Promise resolving to ITodoListUser.IAuthorized with credentials and
 *   tokens.
 * @throws {Error} Throws "Invalid credentials" error when login validation
 *   fails.
 */
export async function postauthUserLogin(props: {
  user: UserPayload;
  body: ITodoListUser.ILogin;
}): Promise<ITodoListUser.IAuthorized> {
  const { body } = props;

  const user = await MyGlobal.prisma.todo_list_user.findFirst({
    where: {
      email: body.email,
      deleted_at: null,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await MyGlobal.password.verify(
    body.password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Current timestamp
  const now = new Date();

  // Calculate expiration dates as ISO strings
  const accessTokenExpiresAt: string & tags.Format<"date-time"> =
    toISOStringSafe(
      new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    );
  const refreshTokenExpiresAt: string & tags.Format<"date-time"> =
    toISOStringSafe(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    );

  // Generate JWT access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: "user",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Generate JWT refresh token
  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

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
