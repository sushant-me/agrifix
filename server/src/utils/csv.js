/** Read a small CSV file's header + first rows (dataset preview). */
export function parseCsvPreview(text, maxRows = 30) {
  const lines = text.split(/\r?\n/).filter((l, i) => l.trim() !== '' || i === 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1, 1 + maxRows).map((line) => {
    const cells = [];
    let buf = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        cells.push(buf.trim());
        buf = '';
      } else buf += ch;
    }
    cells.push(buf.trim());
    return cells;
  });
  return { headers, rows };
}
