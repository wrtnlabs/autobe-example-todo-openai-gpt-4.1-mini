import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import { IPageITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListAppTodoItem";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { UserPayload } from "../decorators/payload/UserPayload";

export async function patchTodoListAppUserTodoListAppUsersTodoListAppUserIdTodoListAppTodoItems(props: {
  user: UserPayload;
  todoListAppUserId: string & tags.Format<"uuid">;
  body: ITodoListAppTodoItem.IRequest;
}): Promise<IPageITodoListAppTodoItem.ISummary> {
  const { user, todoListAppUserId, body } = props;

  if (user.id !== todoListAppUserId) {
    throw new HttpException(
      "Forbidden: Cannot access other users' todo items",
      403,
    );
  }

  const page = Number(body.page ?? 1);
  const limit = Number(body.limit ?? 10);
  const skip = (page - 1) * limit;

  const where = {
    todo_list_app_user_id: todoListAppUserId,
    ...(body.search !== undefined &&
      body.search !== null &&
      body.search.length > 0 && {
        description: { contains: body.search },
      }),
  };

  const [items, total] = await Promise.all([
    MyGlobal.prisma.todo_list_app_todo_items.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        description: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.todo_list_app_todo_items.count({ where }),
  ]);

  const data = items.map((item) => ({
    id: item.id,
    description: item.description,
    status: typia.assert<"pending" | "done">(item.status),
    created_at: toISOStringSafe(item.created_at),
  }));

  const pagination = {
    current: page,
    limit: limit,
    records: total,
    pages: Math.ceil(total / limit),
  };

  return {
    pagination,
    data,
  };
}
