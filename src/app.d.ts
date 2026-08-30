declare global {
  namespace App {
    interface Platform {
      env?: {
        DB?: import('@cloudflare/workers-types').D1Database;
      };
    }
  }
}

export {};
