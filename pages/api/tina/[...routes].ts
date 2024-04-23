import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from "tinacms-authjs";
import type { IncomingMessage, ServerResponse } from 'http';

import databaseClient from "../../../tina/__generated__/databaseClient";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient: databaseClient,
          secret: process.env.NEXTAUTH_SECRET ?? '',
        }),
      }),
  databaseClient,
});

const TinaApiRoutes = (req: IncomingMessage, res: ServerResponse) => {
  // Modify the request here if you need to
  return handler(req, res);
};

export default TinaApiRoutes;
