import { useEffect } from "react";

/** Sets the browser tab title, e.g. "Troškovi · AgroTracker". */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · AgroTracker` : "AgroTracker";
  }, [title]);
}
