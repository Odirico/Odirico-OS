export const DESIGNER_ROSTER = [
  { id: "00000000-0000-4000-8000-000000000011", name: "Avery Stone", team: "Alpha" },
  { id: "00000000-0000-4000-8000-000000000012", name: "Morgan Lee", team: "Bravo" },
  { id: "00000000-0000-4000-8000-000000000013", name: "Jordan Cruz", team: "Charlie" },
  { id: "00000000-0000-4000-8000-000000000014", name: "Riley Brooks", team: "Alpha" },
  { id: "00000000-0000-4000-8000-000000000015", name: "Taylor Reed", team: "Bravo" },
] as const;

function hash(input: string) {
  let value = 0;

  for (let index = 0; index < input.length; index += 1) {
    value = (value << 5) - value + input.charCodeAt(index);
    value |= 0;
  }

  return Math.abs(value);
}

export function resolveDesignerAlias(sourceId: string | null | undefined) {
  const safeSourceId = sourceId?.trim() || "designer-fallback";
  return DESIGNER_ROSTER[hash(safeSourceId) % DESIGNER_ROSTER.length];
}
