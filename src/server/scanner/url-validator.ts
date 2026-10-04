import { promises as dns } from "dns";
import * as ipaddr from "ipaddr.js";

export function isSafeIp(ipString: string): boolean {
  // Allow local/private IP testing in development environment
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  try {
    const ip = ipaddr.parse(ipString);

    // For IPv4 and IPv4-mapped IPv6
    if (ip.kind() === "ipv4" || (ip.kind() === "ipv6" && (ip as ipaddr.IPv6).isIPv4MappedAddress())) {
      const v4 = ip.kind() === "ipv4" ? ip as ipaddr.IPv4 : (ip as ipaddr.IPv6).toIPv4Address();
      const range = v4.range();
      
      // Allow only explicitly unicast public IP spaces
      // 'unicast' is the normal public space in ipaddr.js
      if (range !== "unicast") {
        return false;
      }
      return true;
    }

    // For IPv6
    if (ip.kind() === "ipv6") {
      const v6 = ip as ipaddr.IPv6;
      const range = v6.range();
      
      // Allow only explicitly unicast public IP spaces
      if (range !== "unicast") {
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    // If we can't parse it, it's unsafe
    return false;
  }
}

export async function validateAndNormalizeUrl(inputUrl: string): Promise<string> {
  let urlObj: URL;
  
  try {
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

  // Reject all ports except 80 and 443
  if (urlObj.port && urlObj.port !== "80" && urlObj.port !== "443") {
    throw new Error("Only ports 80 and 443 are allowed");
  }

  const hostname = urlObj.hostname;
  
  // Basic string match for common localhosts to fail early
  if (process.env.NODE_ENV !== "development") {
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      throw new Error("Internal hostnames are not allowed");
    }
  }

  // Resolve all DNS A and AAAA records to catch DNS rebinding attempts 
  // where one public and one private IP are returned.
  try {
    let addresses: string[] = [];
    
    // Check if hostname is already a raw IP
    if (ipaddr.isValid(hostname)) {
      addresses = [hostname];
    } else {
      // Resolve both IPv4 and IPv6
      const results = await dns.lookup(hostname, { all: true });
      addresses = results.map(r => r.address);
    }

    if (addresses.length === 0) {
      throw new Error(`Failed to resolve hostname: ${hostname}`);
    }

    for (const address of addresses) {
      if (!isSafeIp(address)) {
        throw new Error(`Target resolves to a private or reserved IP address (${address})`);
      }
    }
  } catch (err: any) {
    if (err.message.includes("private or reserved IP address")) {
      throw err;
    }
    throw new Error(`Failed to resolve hostname: ${hostname}`);
  }

  return urlObj.toString();
}
