export async function apiRequest(method: string, url: string, body?: any) {
  // Υπολογίζουμε το πλήρες URL (με origin) για πιο καθαρά logs στο Replit
  const fullUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : typeof window !== "undefined"
        ? new URL(url, window.location.origin).toString()
        : url;

  console.log(
    `[API Request] ${method} ${fullUrl}`,
    body ? `Body: ${JSON.stringify(body)}` : ""
  );
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const res = await fetch(fullUrl, options);
    console.log(
      `[API Request] ${method} ${fullUrl} - Status: ${res.status} ${res.statusText}`
    );
    
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: res.statusText }));
      console.error(
        `[API Request] ${method} ${fullUrl} - Error response:`,
        errorData
      );
      throw new Error(errorData.error || res.statusText || "Request failed");
    }

    const data = await res.json();
    console.log(
      `[API Request] ${method} ${fullUrl} - Success response:`,
      data
    );
    return data;
  } catch (error: any) {
    console.error(
      `[API Request] ${method} ${fullUrl} - Fetch error:`,
      error?.message,
      error
    );
    throw error;
  }
}
