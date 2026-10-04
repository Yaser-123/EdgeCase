async function test() {
  console.log("Testing normal responsive website...");
  let res = await fetch("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" })
  });
  let data = await res.json();
  console.log("Status:", data.status);
  console.log("A11y Violations:", data.accessibility?.violationsCount);
  console.log("Stress Issues:", data.stress?.totalFindings);
  console.log("Stress Scenarios Completed:", data.stress?.scenariosCompleted);
  console.log("Security Findings:", data.security?.totalFindings);
  console.log("Network Scenarios Completed:", data.network?.scenariosCompleted);
  console.log("Network Findings:", data.network?.totalFindings);

  console.log("\nTesting website with potential issues (e.g. older site)...");
  res = await fetch("http://localhost:3000/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.w3.org" })
  });
  data = await res.json();
  console.log("Status:", data.status);
  console.log("A11y Violations:", data.accessibility?.violationsCount);
  console.log("Stress Issues:", data.stress?.totalFindings);
  console.log("Stress Scenarios Completed:", data.stress?.scenariosCompleted);
  console.log("Security Findings:", data.security?.totalFindings);
  console.log("Network Scenarios Completed:", data.network?.scenariosCompleted);
  console.log("Network Findings:", data.network?.totalFindings);
}
test();
