import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    video: { maxFileSize: "128MB", maxFileCount: 5 },
  }).onUploadComplete(async () => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
