import { IPage } from "./IPage";
import { ITodoListAppTodoListAppUsers } from "./ITodoListAppTodoListAppUsers";

export namespace IPageITodoListAppTodoListAppUsers {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: ITodoListAppTodoListAppUsers.ISummary[];
  };
}
