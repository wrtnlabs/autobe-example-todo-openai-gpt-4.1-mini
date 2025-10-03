import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListAppTodoListAppUsers";
import type { ITodoListAppTodoListAppUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppTodoListAppUsers";
import type { ITodoListAppUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAppUser";

export async function test_api_todo_list_app_user_search_and_retrieve_paginated_filtered_list(
  connection: api.IConnection,
) {
  // 1. Register a new user via /auth/user/join
  const emailForJoin = `testuser_${RandomGenerator.alphaNumeric(6)}@example.com`;
  const passwordForJoin = `pass_${RandomGenerator.alphaNumeric(8)}`;
  const joinBody = {
    email: emailForJoin,
    password_hash: passwordForJoin,
    email_verified: RandomGenerator.pick([true, false] as const),
  } satisfies ITodoListAppUser.ICreate;

  const authorizedUser = await api.functional.auth.user.join(connection, {
    body: joinBody,
  });
  typia.assert(authorizedUser);
  TestValidator.predicate("user id is uuid", !!authorizedUser.id);

  // 2. Perform search via todoListAppUsers.index with filters
  // Create multiple realistic search requests to test filtering

  const searchTests: {
    description: string;
    requestBody: ITodoListAppTodoListAppUsers.IRequest;
  }[] = [];

  // Search with email substring exactly matching the joined user email substring (e.g. testuser_)
  searchTests.push({
    description: "Search users with email containing 'testuser_'",
    requestBody: {
      page: 1,
      limit: 10,
      search: "testuser_",
      email_verified: null,
      sort_by: "created_at",
      order: "desc",
    } satisfies ITodoListAppTodoListAppUsers.IRequest,
  });

  // Search with email_verified true
  searchTests.push({
    description: "Search users with email_verified true",
    requestBody: {
      page: 1,
      limit: 10,
      search: null,
      email_verified: true,
      sort_by: "created_at",
      order: "asc",
    } satisfies ITodoListAppTodoListAppUsers.IRequest,
  });

  // Search with email_verified false
  searchTests.push({
    description: "Search users with email_verified false",
    requestBody: {
      page: 1,
      limit: 10,
      search: null,
      email_verified: false,
      sort_by: "email",
      order: "asc",
    } satisfies ITodoListAppTodoListAppUsers.IRequest,
  });

  // Search with no filter (all users)
  searchTests.push({
    description: "Search users with no filters",
    requestBody: {
      page: 1,
      limit: 20,
      search: null,
      email_verified: null,
      sort_by: null,
      order: null,
    } satisfies ITodoListAppTodoListAppUsers.IRequest,
  });

  // Execute all searches and validate results
  for (const test of searchTests) {
    const result: IPageITodoListAppTodoListAppUsers.ISummary =
      await api.functional.todoListApp.user.todoListAppUsers.index(connection, {
        body: test.requestBody,
      });
    typia.assert(result);

    TestValidator.predicate(
      `Pagination has positive current page for: ${test.description}`,
      result.pagination.current > 0,
    );
    TestValidator.predicate(
      `Pagination limit is positive for: ${test.description}`,
      result.pagination.limit > 0,
    );
    TestValidator.predicate(
      `Pagination pages is non-negative for: ${test.description}`,
      result.pagination.pages >= 0,
    );

    // Validate each user matches search criteria
    for (const user of result.data) {
      typia.assert(user);
      TestValidator.predicate(
        `User id is uuid for: ${test.description}`,
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          user.id,
        ),
      );

      TestValidator.predicate(
        `User email string present for: ${test.description}`,
        typeof user.email === "string" && user.email.length > 0,
      );

      // Validate email_verified filter if used
      if (
        test.requestBody.email_verified !== null &&
        test.requestBody.email_verified !== undefined
      ) {
        TestValidator.equals(
          `User email_verified matches filter for: ${test.description}`,
          user.email_verified,
          test.requestBody.email_verified,
        );
      }

      // Validate email contains search substring if search is used
      if (
        test.requestBody.search !== null &&
        test.requestBody.search !== undefined
      ) {
        TestValidator.predicate(
          `User email contains search string for: ${test.description}`,
          user.email.includes(test.requestBody.search),
        );
      }
    }
  }
}
