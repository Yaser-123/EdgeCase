async function run() {
  try {
    console.log("Fetching stress test results from local API...");
    const res = await fetch("http://localhost:3000/api/test-stress");
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
run();
