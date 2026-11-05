async function searchClient() {
  const html = await (await fetch('https://app.warera.io')).text();
  const scriptMatches = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Scripts:', scriptMatches);
  for (const src of scriptMatches) {
    const fullUrl = src.startsWith('http') ? src : 'https://app.warera.io' + src;
    const js = await (await fetch(fullUrl)).text();
    console.log('Fetched', fullUrl, js.length, 'bytes');
    
    // Search for manager-related trpc routes or state
    const trpcMatches = js.match(/[a-zA-Z0-9]+\.(?:[a-zA-Z0-9]+Manager[a-zA-Z0-9]*|manager[a-zA-Z0-9]*)/g) || [];
    console.log('trpcMatches:', [...new Set(trpcMatches)]);

    // Search for managerRole or manager wage or manager salary
    const wageMatches = js.match(/.{0,40}(?:managerSalary|managerWage|managerPay|managerTax|hiredManager|managerBonus|managerRole).{0,40}/gi) || [];
    console.log('wageMatches:', [...new Set(wageMatches)].slice(0, 15));
  }
}
searchClient().catch(console.error);
