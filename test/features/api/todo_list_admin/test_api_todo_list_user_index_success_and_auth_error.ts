import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListUser";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListUser";

/**
 * Test admin user listing endpoint with authorization.
 *
 * 1. Create an admin user with POST /auth/admin/join
 * 2. Assert admin authorization information in response
 * 3. Perform PATCH /todoList/admin/users with filtering for email substring,
 *    pagination, and sorting
 * 4. Assert response matches paginated todo list user summaries
 * 5. Attempt to perform the user listing without authentication
 * 6. Assert that unauthorized access fails
 */
export async function test_api_todo_list_user_index_success_and_auth_error(
  connection: api.IConnection,
) {
  // Step 1: Create admin user
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = "StrongPass123!";
  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ITodoListAdmin.ICreate,
    });
  typia.assert(admin);

  // Step 2: Prepare request for user list with filtering, pagination, sorting
  const filterRequest: ITodoListUser.IRequest = {
    page: 1,
    limit: 10,
    emailContains: adminEmail.slice(0, adminEmail.indexOf("@")),
    createdAfter: null,
    createdBefore: null,
    sortBy: "created_at",
    sortDirection: "desc",
  };

  // Step 3: Perform PATCH /todoList/admin/users with authenticated admin
  const pageResult: IPageITodoListUser.ISummary =
    await api.functional.todoList.admin.users.index(connection, {
      body: filterRequest,
    });
  typia.assert(pageResult);

  // Verify pagination info
  const { pagination, data } = pageResult;
  TestValidator.predicate(
    "pagination current is positive",
    pagination.current > 0,
  );
  TestValidator.predicate("pagination limit is positive", pagination.limit > 0);
  TestValidator.predicate(
    "pagination records is non-negative",
    pagination.records >= 0,
  );
  TestValidator.predicate("pagination pages is positive", pagination.pages > 0);

  // Check data array
  TestValidator.predicate(
    "data is array",
    Array.isArray(data) &&
      data.every((elem) => elem !== null && typeof elem === "object"),
  );

  // Check each user's summary fields
  for (const userSummary of data) {
    TestValidator.predicate(
      "user id is uuid",
      typeof userSummary.id === "string" &&
        /^[0-9a-fA-F-]{36}$/.test(userSummary.id),
    );
    TestValidator.predicate(
      "user email contains '@'",
      typeof userSummary.email === "string" && userSummary.email.includes("@"),
    );
    // Check created_at and updated_at as ISO strings
    TestValidator.predicate(
      "user created_at is ISO string",
      typeof userSummary.created_at === "string" &&
        !isNaN(Date.parse(userSummary.created_at)),
    );
    TestValidator.predicate(
      "user updated_at is ISO string",
      typeof userSummary.updated_at === "string" &&
        !isNaN(Date.parse(userSummary.updated_at)),
    );
  }

  // Step 4: Test unauthorized access attempt
  // Create unauthenticated connection with cleared headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized access to admin user list fails",
    async () => {
      await api.functional.todoList.admin.users.index(
        unauthenticatedConnection,
        {
          body: filterRequest,
        },
      );
    },
  );
}
