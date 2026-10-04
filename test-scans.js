

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
      // Trim screenshot
      console.log(`Screenshot: ${data.screenshot?.substring(0, 30)}...`);
    }
  } catch (err) {
    console.error("Script Error:", err.message);
  }
}

async function runAll() {
  await runTest("https://example.com", "Simple Public Website");
  await runTest("https://news.ycombinator.com", "Website with Accessibility Violations");
  await runTest("not-a-url", "Invalid URL");
  await runTest("https://this-does-not-exist.example.org", "Unreachable Website");
  await runTest("https://httpstat.us/200?sleep=40000", "Timeout Website");
}

runAll();
