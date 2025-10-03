import { IPage } from "./IPage";
import { ITodoListAppTodoItem } from "./ITodoListAppTodoItem";

export namespace IPageITodoListAppTodoItem {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: ITodoListAppTodoItem.ISummary[];
  };
}
