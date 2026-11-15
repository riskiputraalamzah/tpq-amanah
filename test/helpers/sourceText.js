// Source checks that survive a formatter (Prettier in the editor): line breaks, indentation and the trailing commas
// it adds do not matter, only the code itself. Use squash() on the file once, and has() for each piece looked for.
//   const kbm = squash(read("src/views/..."));
//   assert.ok(has(kbm, 'api.get("/x", { params: { period: p } })'));
export const squash = (text) =>
  String(text)
    .replace(/\s+/g, "")
    .replace(/,(?=[)}\]>])/g, "");

export const has = (squashed, piece) => squashed.includes(squash(piece));
