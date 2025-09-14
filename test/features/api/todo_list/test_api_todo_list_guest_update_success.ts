import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ITodoListAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListAdmin";
import type { ITodoListGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListGuest";

export async function test_api_todo_list_guest_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user signs up
  const adminCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@test.com",
    password: "admin1234",
  } satisfies ITodoListAdmin.ICreate;

  const admin: ITodoListAdmin.IAuthorized =
    await api.functional.auth.admin.join.joinAdmin(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 2. Guest user joins
  const guest: ITodoListGuest.IAuthorized =
    await api.functional.auth.guest.join.joinGuest(connection);
  typia.assert(guest);

  // 3. Prepare update data for the guest
  const now = new Date();
  const createdAt = now.toISOString();
  const updatedAt = new Date(now.getTime() + 60 * 1000).toISOString();

  // Randomly decide whether to set deleted_at to null or a recent timestamp
  const deletedAtDecision = Math.random();
  const deletedAt =
    deletedAtDecision < 0.5
      ? null
      : new Date(now.getTime() - 60 * 1000).toISOString();

  const updateBody = {
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: deletedAt,
  } satisfies ITodoListGuest.IUpdate;

  // 4. Admin updates the guest
  const updatedGuest: ITodoListGuest =
    await api.functional.todoList.admin.guests.update(connection, {
      guestId: guest.id,
      body: updateBody,
    });
  typia.assert(updatedGuest);

  // 5. Validate that the update response matches the input update
  TestValidator.equals("guest id should match", updatedGuest.id, guest.id);

  TestValidator.equals(
    "created_at should match update",
    updatedGuest.created_at,
    createdAt,
  );
  TestValidator.equals(
    "updated_at should match update",
    updatedGuest.updated_at,
    updatedAt,
  );

  // deleted_at can be null or valid ISO string
  if (deletedAt === null) {
    TestValidator.equals(
      "deleted_at should be null",
      updatedGuest.deleted_at,
      null,
    );
  } else {
    TestValidator.equals(
      "deleted_at should match update",
      updatedGuest.deleted_at,
      deletedAt,
    );
  }
}
