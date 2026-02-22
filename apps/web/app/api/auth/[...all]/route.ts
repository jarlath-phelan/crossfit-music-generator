import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function safeHandler(req: Request) {
  try {
    return await handler.GET!(req);
  } catch {
    return Response.json(null, { status: 200 });
  }
}

async function safePostHandler(req: Request) {
  try {
    return await handler.POST!(req);
  } catch {
    return Response.json(null, { status: 200 });
  }
}

export { safeHandler as GET, safePostHandler as POST };
