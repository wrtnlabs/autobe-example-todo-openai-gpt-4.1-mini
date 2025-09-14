import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";
import { UserPayload } from "../decorators/payload/UserPayload";

/**
 * Registers a new user account in the todo list system.
 *
 * This endpoint creates a new record in the todo_list_user table with the
 * provided email and plaintext password which is hashed before storage. It
 * ensures the email is unique and issues JWT tokens for authentication upon
 * successful registration.
 *
 * No authentication is required to call this endpoint.
 *
 * @param props - Object containing the authenticated user payload and request
 *   body.
 * @param props.user - The authenticated user's payload (not used in
 *   registration but present for API contract).
 * @param props.body - The request body containing user creation data (email and
 *   plaintext password).
 * @returns The authorized user object including JWT tokens for access and
 *   refresh.
 * @throws {Error} When the email already exists in the system.
 */
export async function postauthUserJoin(props: {
  user: UserPayload;
  body: ITodoListUser.ICreate;
}): Promise<ITodoListUser.IAuthorized> {
  const { body } = props;

  // Check if email already exists
  const existingUser = await MyGlobal.prisma.todo_list_user.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    throw new Error(`Email already registered: ${body.email}`);
  }

  // Hash the plaintext password
  const hashedPassword = await MyGlobal.password.hash(body.password);

  // Generate new UUID
  const id = v4() as string & tags.Format<"uuid">;

  // Use toISOStringSafe to get current timestamp string
  const now = toISOStringSafe(new Date());

  // Create new user in the database
  const created = await MyGlobal.prisma.todo_list_user.create({
    data: {
      id,
      email: body.email,
      password_hash: hashedPassword,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Define JWT expiration timings
  const accessExpiresInSeconds = 3600; // 1 hour
  const refreshExpiresInSeconds = 7 * 24 * 3600; // 7 days

  // Compute expiry date strings
  const accessExpiredAt = toISOStringSafe(
    new Date(Date.now() + accessExpiresInSeconds * 1000),
  );
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + refreshExpiresInSeconds * 1000),
  );

  // Generate access JWT token
  const accessToken = jwt.sign(
    {
      userId: created.id,
      email: created.email,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Generate refresh JWT token
  const refreshToken = jwt.sign(
    {
      userId: created.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Return the authorized user including tokens
  return {
    id: created.id,
    email: created.email,
    password_hash: created.password_hash,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
