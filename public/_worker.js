// Cloudflare Workers script for SPA routing
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Try to serve the requested path first
    let response = await env.ASSETS.fetch(request);
    
    // If the path doesn't exist (404), serve index.html instead
    // This enables client-side routing for SPA
    if (response.status === 404) {
      const indexUrl = new URL('/', request.url);
      response = await env.ASSETS.fetch(indexUrl);
      
      // Return the index.html with 200 status for client-side routing
      return new Response(response.body, {
        status: 200,
        headers: response.headers
      });
    }
    
    return response;
  }
};