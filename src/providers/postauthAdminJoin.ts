import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import { AdminPayload } from "../decorators/payload/AdminPayload";

/**
 * Create administrator account in todo_list_admin.
 *
 * This function registers a new administrator in the system by creating a
 * record in the todo_list_admin table. It checks for duplicate emails, hashes
 * the password securely, and generates JWT access and refresh tokens.
 *
 * The access token expires in 1 hour, and the refresh token expires in 7 days.
 * The issuer for tokens is always 'autobe'.
 *
 * @param props - Object containing the registration input data
 * @param props.body - Registration information requiring email and plain
 *   password
 * @returns The authorized admin account tokens with admin ID
 * @throws {Error} If the email is already registered
 */
export async function postauthAdminJoin(props: {
  body: ITodoListAdmin.ICreate;
}): Promise<ITodoListAdmin.IAuthorized> {
  const { body } = props;

  // Check if an admin with the same email already exists and is not soft deleted
  const existingAdmin = await MyGlobal.prisma.todo_list_admin.findFirst({
    where: { email: body.email, deleted_at: null },
  });
  if (existingAdmin !== null) {
    throw new Error("Email already registered");
  }

  // Hash the password using MyGlobal.password
  const hashedPassword = await MyGlobal.password.hash(body.password);

  // Generate UUID for new admin
  const newAdminId = v4() as string & tags.Format<"uuid">;

  // Create the new admin record
  const newAdmin = await MyGlobal.prisma.todo_list_admin.create({
    data: {
      id: newAdminId,
      email: body.email,
      password_hash: hashedPassword,
    },
  });

  // Generate expiration timestamps using toISOStringSafe without native Date usage
  const expiredAt = toISOStringSafe(new Date(Date.now() + 3600 * 1000)); // 1 hour later
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  ); // 7 days later

  // Generate JWT access token
  const accessToken = jwt.sign(
    {
      userId: newAdmin.id,
      email: newAdmin.email,
      type: "admin",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  // Generate JWT refresh token
  const refreshToken = jwt.sign(
    {
      userId: newAdmin.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: newAdminId,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
