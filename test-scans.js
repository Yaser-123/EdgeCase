async function runTest(url, name) {
  console.log(`\n--- Test: ${name} (${url}) ---`);
  const start = Date.now();
  try {
    const res = await fetch("http://localhost:3000/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    const duration = Date.now() - start;
    console.log(`Status Code: ${res.status}`);
    console.log(`Response Status: ${data.status}`);
    console.log(`Test Duration: ${duration}ms`);
    if (data.status === "error") {
      console.log(`Error: ${data.error}`);
    } else {
      console.log(`Title: ${data.metadata?.title}`);
      console.log(`Load time: ${data.timing?.duration}ms`);
      console.log(`Violations: ${data.accessibility?.violationsCount}, Passes: ${data.accessibility?.passesCount}`);
      console.log(`Screenshot Length: ${data.screenshot?.length} chars`);
    }
  } catch (err) {
    console.error("Script Error:", err.message);
  }
}

async function runAll() {
  await runTest("https://example.com", "Normal Public URL (Pre-timeout)");
  await runTest("https://example.com/edgecase-test-timeout", "Deterministic timeout");
  await runTest("https://example.com", "Normal Public URL (Post-timeout recovery)");
}

runAll();
