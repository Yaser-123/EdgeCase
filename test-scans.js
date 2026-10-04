async function runTest(url, name) {
  console.log(`\n--- Test: ${name} (${url}) ---`);
  try {
    const res = await fetch("http://localhost:3000/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    console.log(`Status Code: ${res.status}`);
    console.log(`Response Status: ${data.status}`);
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
  await runTest("http://127.0.0.1", "IPv4 loopback URL");
  await runTest("http://[::1]", "IPv6 loopback URL");
  await runTest("http://10.0.0.1", "Private IPv4 URL");
  await runTest("http://example.com:22", "Unsafe port");
  await runTest("https://example.com", "Public URL");
  await runTest("https://example.com/edgecase-test-redirect", "Redirect to a prohibited destination");
  await runTest("https://example.com/edgecase-test-subresource", "Page attempting to request a private-network resource");
  await runTest("https://example.com/edgecase-test-timeout", "Deterministic timeout");
}

runAll();
