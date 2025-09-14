import { ForbiddenException } from "@nestjs/common";
import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { AdminPayload } from "../../decorators/payload/AdminPayload";

export async function adminAuthorize(request: { headers: { authorization?: string } }): Promise<AdminPayload> {
  const payload: AdminPayload = jwtAuthorize({ request }) as AdminPayload;

  if (payload.type !== "admin") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // payload.id contains top-level user table ID
  // Admin is standalone, query by id
  const admin = await MyGlobal.prisma.todo_list_admin.findFirst({
    where: {
      id: payload.id,
      deleted_at: null
    }
  });

  if (admin === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}
