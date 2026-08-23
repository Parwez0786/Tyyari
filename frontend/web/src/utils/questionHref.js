import { QuestionType, ViewMode } from "../data/enums";

export function questionHref(id, type, view, sheet) {
  if (type === QuestionType.OA) return `/practice/${QuestionType.OA}`;
  const query = new URLSearchParams();
  if (type === QuestionType.HLD) {
    if (view) query.set("view", view);
  } else if (type !== QuestionType.CS) {
    query.set("view", view || ViewMode.CODE);
  }
  if (sheet) query.set("sheet", sheet);
  const suffix = query.toString();
  return suffix ? `/questions/${id}?${suffix}` : `/questions/${id}`;
}
