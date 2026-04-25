import { authorType } from "./documents/authorType";
import { postType } from "./documents/postType";
import { siteSettingsType } from "./documents/siteSettingsType";
import { tagType } from "./documents/tagType";
import { codeBlockType } from "./objects/codeBlockType";
import { imageWithAltType } from "./objects/imageWithAltType";
import { socialLinkType } from "./objects/socialLinkType";

export const schemaTypes = [
  postType,
  tagType,
  authorType,
  siteSettingsType,
  codeBlockType,
  imageWithAltType,
  socialLinkType,
];
