import { defineConfig } from "tinacms";
import Post from './collections/post';
import Author from './collections/author';

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      Author,
      Post,
    ],
  },
  search: {
    tina: {
      indexerToken: process.env.TINA_TOKEN_SEARCH,
      stopwordLanguages: ['jpn'],
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },
});
