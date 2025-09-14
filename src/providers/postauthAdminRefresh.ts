import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Refresh administrator tokens
 *
 * This endpoint refreshes JWT access and refresh tokens for an authenticated
 * admin. It verifies the provided refresh token, confirms the admin user exists
 * and is not deleted, and issues new tokens with standard expiry times.
 *
 * @param props - Object containing admin payload and refresh token in the body
 * @param props.admin - Authenticated admin performing this operation
 *   (authorization enforced externally)
 * @param props.body - Object containing the JWT refresh token string
 * @returns An object describing authorized admin including new JWT tokens and
 *   expiry info
 * @throws {Error} When the refresh token is invalid, expired, or admin user is
 *   not found
 */
export async function postauthAdminRefresh(props: {
  admin: AdminPayload;
  body: ITodoListAdmin.IRefresh;
}): Promise<ITodoListAdmin.IAuthorized> {
  const { body } = props;

  // Step 1: Verify refresh token and decode
  const decoded = jwt.verify(body.refreshToken, MyGlobal.env.JWT_SECRET_KEY, {
    issuer: "autobe",
  }) as { id: string & tags.Format<"uuid">; type: "admin"; tokenType?: string };

  // Step 2: Find admin in database
  const admin = await MyGlobal.prisma.todo_list_admin.findFirst({
    where: {
      id: decoded.id,
      deleted_at: null,
    },
  });

  if (!admin) {
    throw new Error("Admin user not found or deleted");
  }

  // Step 3: Prepare timestamps
  const now = Date.now();
  const accessExpiresMs = 60 * 60 * 1000; // 1 hour
  const refreshExpiresMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  const expired_at = toISOStringSafe(new Date(now + accessExpiresMs));
  const refreshable_until = toISOStringSafe(new Date(now + refreshExpiresMs));

  // Step 4: Generate tokens
  const accessToken = jwt.sign(
    { id: admin.id, type: "admin" },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    { id: admin.id, type: "admin", tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Step 5: Return authorized tokens with expiry info
  return {
    id: admin.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at,
      refreshable_until,
    },
  };
}
