import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Authenticate administrator using email and password credentials stored
 * securely in todo_list_admin. Returns JWT access and refresh tokens if
 * credentials are valid.
 *
 * @param props - Object containing admin and login credentials
 * @param props.admin - Authenticated admin payload (not used in login but
 *   required by signature)
 * @param props.body - Login credentials including email and password
 * @returns The authorized admin account tokens
 * @throws {Error} When credentials are invalid
 */
export async function postauthAdminLogin(props: {
  admin: AdminPayload;
  body: ITodoListAdmin.ILogin;
}): Promise<ITodoListAdmin.IAuthorized> {
  const { body } = props;

  // Find admin user with matching email and that is not soft deleted
  const admin = await MyGlobal.prisma.todo_list_admin.findFirst({
    where: {
      email: body.email,
      deleted_at: null,
    },
  });

  if (admin === null) {
    throw new Error("Invalid credentials");
  }

  // Verify password using MyGlobal utilities
  const validPassword = await MyGlobal.password.verify(
    body.password,
    admin.password_hash,
  );
  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const nowRaw = new Date();

  // Convert to string & tags.Format<'date-time'>
  const now = toISOStringSafe(nowRaw);

  // Token expiration dates
  const accessExpires = toISOStringSafe(
    new Date(nowRaw.getTime() + 3600 * 1000),
  ); // +1 hour
  const refreshExpires = toISOStringSafe(
    new Date(nowRaw.getTime() + 7 * 24 * 3600 * 1000),
  ); // +7 days

  // Create JWT access token
  const accessToken = jwt.sign(
    {
      id: admin.id,
      type: "admin",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  // Create JWT refresh token
  const refreshToken = jwt.sign(
    {
      id: admin.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: admin.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpires,
      refreshable_until: refreshExpires,
    },
  };
}
