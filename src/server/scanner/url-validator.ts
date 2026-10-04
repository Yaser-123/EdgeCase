import { promises as dns } from "dns";

const isPrivateIp = (ip: string) => {
  const parts = ip.split(".").map((part) => parseInt(part, 10));

  // Loopback (127.0.0.0/8)
  if (parts[0] === 127) return true;
  // Private A (10.0.0.0/8)
  if (parts[0] === 10) return true;
  // Private B (172.16.0.0/12)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // Private C (192.168.0.0/16)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // Link-local (169.254.0.0/16)
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
};

export async function validateAndNormalizeUrl(inputUrl: string): Promise<string> {
  let urlObj: URL;
  
  try {
    // Add https if missing to allow easy parsing
    const urlStr = inputUrl.startsWith("http://") || inputUrl.startsWith("https://") 
      ? inputUrl 
      : `https://${inputUrl}`;
      
    urlObj = new URL(urlStr);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Allow only HTTP and HTTPS
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS protocols are supported");
  }

  // Reject explicit localhost or private TLDs
  const hostname = urlObj.hostname;
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Internal hostnames are not allowed");
  }

  // Resolve DNS to check against SSRF
  try {
    const lookupResult = await dns.lookup(hostname);
    if (isPrivateIp(lookupResult.address)) {
      throw new Error("Target resolves to a private or reserved IP address");
    }
  } catch (err: any) {
    if (err.message === "Target resolves to a private or reserved IP address") {
      throw err;
    }
    throw new Error(`Failed to resolve hostname: ${hostname}`);
  }

  return urlObj.toString();
}
