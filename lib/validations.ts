import { z } from "zod";

export const mangaFormSchema = z.object({
  mangaUrl: z
    .string()
    .min(1, "Chapter URL is required.")
    .url({
      message: "Please enter a valid URL (e.g. https://site.com/chapter/1).",
    }),
});

export type MangaFormSchema = z.infer<typeof mangaFormSchema>;
