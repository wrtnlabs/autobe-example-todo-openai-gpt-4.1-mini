import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";

export namespace ITodoListAdmin {
  /**
   * Request body for creating a new admin account.
   *
   * Includes email and password for registration.
   *
   * Email must be unique; password is plain text and will be hashed.
   *
   * Used in admin join operation.
   */
  export type ICreate = {
    /** Unique email address for the administrator. */
    email: string & tags.Format<"email">;

    /** Plain text password for admin account creation. */
    password: string;
  };

  /**
   * Authentication response type for an administrator.
   *
   * Includes admin id and JWT token information.
   *
   * Used in admin login and join operations.
   */
  export type IAuthorized = {
    /** Unique identifier of the administrator. */
    id: string & tags.Format<"uuid">;

    /** JWT token information for authentication */
    token: IAuthorizationToken;
  };

  /**
   * Payload sent to login an admin user.
   *
   * Email: unique admin email for authentication. password: plaintext
   * password for validation (only input).
   */
  export type ILogin = {
    /** Admin email address used for login authentication */
    email: string & tags.Format<"email">;

    /** Plaintext password used for login authentication */
    password: string;
  };

  /** Payload sent to request refresh of JWT tokens. */
  export type IRefresh = {
    /** JWT refresh token string */
    refreshToken: string;
  };
}
