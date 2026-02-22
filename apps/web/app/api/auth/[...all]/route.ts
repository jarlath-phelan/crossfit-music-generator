import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

function isDbConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("connection") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("database")
    );
  }
  return false;
}

async function safeHandler(req: Request) {
  try {
    return await handler.GET!(req);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[auth] Database connection error:", error);
      return Response.json(null, { status: 200 });
    }
    console.error("[auth] GET error:", error);
    return Response.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

async function safePostHandler(req: Request) {
  try {
    return await handler.POST!(req);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[auth] Database connection error:", error);
      return Response.json(null, { status: 200 });
    }
    console.error("[auth] POST error:", error);
    return Response.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

export { safeHandler as GET, safePostHandler as POST };
