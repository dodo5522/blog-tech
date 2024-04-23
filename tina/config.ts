import { LocalAuthProvider, defineConfig } from "tinacms";
import { UsernamePasswordAuthJSProvider, TinaUserCollection } from "tinacms-authjs/dist/tinacms";
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const branch = process.env.NEXT_PUBLIC_TINA_BRANCH ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    "main";
export default defineConfig({
    contentApiUrlOverride: "/api/tina/gql",
    authProvider: isLocal ? new LocalAuthProvider() : new UsernamePasswordAuthJSProvider(),
    branch,
    token: '<Your Read Only Token>', // generated on app.tina.io
    clientId: '<Your Client ID>', // generated on app.tina.io
    build: {
        publicFolder: "public",
        outputFolder: "admin" // within the public folder
    },
    // See https://tina.io/docs/reference/schema/ for more information
    schema: {
        collections: [
            TinaUserCollection
        ]
    }
});
