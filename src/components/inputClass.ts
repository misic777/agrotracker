/** Shared look of text inputs, selects and textareas. */
export function inputClass(invalid = false): string {
  return [
    "min-h-11 min-w-0 rounded-field bg-sand-50 px-3 text-soil-900 placeholder:text-soil-700/60",
    "focus:outline-2 focus:outline-offset-1 focus:outline-leaf-600",
    invalid ? "border-2 border-clay-600" : "border border-sand-300",
  ].join(" ");
}
