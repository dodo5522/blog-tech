import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteUrl",
      title: "Site URL",
      type: "url",
      validation: (rule) =>
        rule
          .required()
          .uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "defaultSeoTitle",
      title: "Default SEO title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "defaultSeoDescription",
      title: "Default SEO description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: "defaultOgImage",
      title: "Default OGP image",
      type: "imageWithAlt",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [{ type: "socialLink" }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Site settings",
      };
    },
  },
});
