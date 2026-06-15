export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {});
  const content = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((header) => String(row[header] ?? '').replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(';'),
    ),
  ].join('\n');

  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
