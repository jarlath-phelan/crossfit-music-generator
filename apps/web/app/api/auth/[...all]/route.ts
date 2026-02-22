import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

function getHandler() {
  return toNextJsHandler(getAuth());
}

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
    const handler = getHandler();
    return await handler.GET!(req);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[auth] Database connection error:", error);
      return Response.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
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
    const handler = getHandler();
    return await handler.POST!(req);
  } catch (error) {
    if (isDbConnectionError(error)) {
      console.error("[auth] Database connection error:", error);
      return Response.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }
    console.error("[auth] POST error:", error);
    return Response.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

export { safeHandler as GET, safePostHandler as POST };
