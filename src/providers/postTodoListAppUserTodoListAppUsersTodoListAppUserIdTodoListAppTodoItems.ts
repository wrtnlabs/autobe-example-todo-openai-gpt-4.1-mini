import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/passwordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListAppTodoItem } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoItem";
import { UserPayload } from "../decorators/payload/UserPayload";

export async function postTodoListAppUserTodoListAppUsersTodoListAppUserIdTodoListAppTodoItems(props: {
  user: UserPayload;
  todoListAppUserId: string & tags.Format<"uuid">;
  body: ITodoListAppTodoItem.ICreate;
}): Promise<ITodoListAppTodoItem> {
  const { user, todoListAppUserId, body } = props;

  if (user.id !== todoListAppUserId) {
    throw new HttpException(
      "Unauthorized: You can only create todo items for your own user ID",
      403,
    );
  }

  const description = body.description;
  if (description.length === 0 || description.length > 256) {
    throw new HttpException(
      "Bad Request: Description must be non-empty and at most 256 characters",
      400,
    );
  }

  const status = body.status;
  if (status !== "pending" && status !== "done") {
    throw new HttpException(
      "Bad Request: Status must be either 'pending' or 'done'",
      400,
    );
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.todo_list_app_todo_items.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      todo_list_app_user_id: todoListAppUserId,
      description,
      status,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    todo_list_app_user_id: created.todo_list_app_user_id,
    description: created.description,
    status: created.status as "pending" | "done",
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
