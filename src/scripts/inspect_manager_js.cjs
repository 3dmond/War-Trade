async function inspectManagerDetails() {
  const url = 'https://app.warera.io/_next/static/chunks/pages/_app-da3cf1b044f7c7b8.js';
  const js = await (await fetch(url)).text();

  const terms = ['getManagerPointValue', 'managerOffer', 'hiredManager', 'managerSalary', 'setManager', 'fireManager', 'managerTax'];
  for (const t of terms) {
    let idx = 0;
    console.log(`\n=== Matches for: ${t} ===`);
    while ((idx = js.indexOf(t, idx)) !== -1) {
      const snippet = js.slice(Math.max(0, idx - 150), Math.min(js.length, idx + 250));
      console.log('--- Snippet ---:\n', snippet);
      idx += t.length;
      if (idx > js.indexOf(t) + 1500) break; // max 3 snippets per term
    }
  }
}
inspectManagerDetails().catch(console.error);
