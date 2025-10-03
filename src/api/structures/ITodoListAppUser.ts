import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";

export namespace ITodoListAppUser {
  /**
   * User account creation data required for registering a new user in the
   * todo_list_app_users table.
   *
   * This schema contains the essential fields needed to create a user: email
   * address, hashed password, and email verification status.
   *
   * These fields ensure secure authentication and registration support.
   */
  export type ICreate = {
    /**
     * User's unique email address to be used for login and identity
     * verification.
     */
    email: string & tags.Format<"email">;

    /**
     * Hashed password for user authentication, never store plain text
     * passwords.
     */
    password_hash: string;

    /** Flag indicating whether the user's email address has been verified. */
    email_verified: boolean;
  };

  /**
   * Authorization response containing JWT token and authenticated user ID.
   *
   * This response is returned after successful authentication operations such
   * as login and registration.
   */
  export type IAuthorized = {
    /** Unique identifier of the authorized user. */
    id: string & tags.Format<"uuid">;

    /** JWT token information for authentication */
    token: IAuthorizationToken;
  };

  /**
   * User login credentials including email and plaintext password for
   * verification during authentication.
   */
  export type ILogin = {
    /** User's registered email address used for login. */
    email: string & tags.Format<"email">;

    /** Plain text password used for authentication verification. */
    password: string;
  };

  /**
   * Refresh token request data containing the token used to renew JWT access
   * tokens.
   */
  export type IRefresh = {
    /**
     * Refresh token provided during authentication, used to obtain new
     * access tokens.
     */
    refreshToken: string;
  };
}
