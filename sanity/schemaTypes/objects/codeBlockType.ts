import { defineField, defineType } from "sanity";

export const codeBlockType = defineType({
  name: "codeBlock",
  title: "Code block",
  type: "object",
  fields: [
    defineField({
      name: "filename",
      title: "Filename",
      type: "string",
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      initialValue: "text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "text",
      rows: 12,
      validation: (rule) => rule.required(),
    }),
  ],
});
