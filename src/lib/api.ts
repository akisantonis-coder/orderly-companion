export async function apiRequest(method: string, url: string, body?: any) {
  console.log(`[API Request] ${method} ${url}`, body ? `Body: ${JSON.stringify(body)}` : '');
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const res = await fetch(url, options);
    console.log(`[API Request] ${method} ${url} - Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      console.error(`[API Request] ${method} ${url} - Error:`, errorData);
      throw new Error(errorData.error || res.statusText);
    }
    
    const data = await res.json();
    console.log(`[API Request] ${method} ${url} - Success:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API Request] ${method} ${url} - Fetch error:`, error);
    throw error;
  }
}
