import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListGuest";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

export async function test_api_todo_list_guest_index_success(
  connection: api.IConnection,
) {
  // 1. Create admin user (first dependency)
  const admin1: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password: "password123",
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin1);

  // 2. Create admin user (second dependency duplication)
  const admin2: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password: "password123",
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin2);

  // 3. With the authenticated admin context, query paginated guests list
  const requestBody = {
    page: 1,
    limit: 10,
  } satisfies ITodoListGuest.IRequest;

  const guestsPage: IPageITodoListGuest =
    await api.functional.todoList.admin.guests.index(connection, {
      body: requestBody,
    });
  typia.assert(guestsPage);

  // 4. Validate pagination metadata
  TestValidator.predicate(
    "pagination current page should be 1",
    guestsPage.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit should be 10",
    guestsPage.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination pages should be >= 0",
    guestsPage.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records should be >= 0",
    guestsPage.pagination.records >= 0,
  );

  // 5. Validate guest list integrity
  TestValidator.predicate(
    "guest data array should be an array",
    Array.isArray(guestsPage.data),
  );
  TestValidator.predicate(
    "every guest should have valid uuid id",
    guestsPage.data.every(
      (guest) =>
        typeof guest.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          guest.id,
        ),
    ),
  );
  TestValidator.predicate(
    "every guest should have valid created_at and updated_at",
    guestsPage.data.every(
      (guest) =>
        typeof guest.created_at === "string" &&
        typeof guest.updated_at === "string" &&
        !isNaN(Date.parse(guest.created_at)) &&
        !isNaN(Date.parse(guest.updated_at)),
    ),
  );
}
