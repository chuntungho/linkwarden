import { prisma } from "@linkwarden/prisma";
import fetchHeaders from "./fetchHeaders";
import { removeFiles } from "@linkwarden/filesystem";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import {
  assertUrlIsSafeForServerSideFetch,
  UnsafeUrlError,
} from "@linkwarden/lib/ssrf";

export default async function archiveHandler(
  link: LinkWithCollectionOwnerAndTags
) {
  if (link.url) {
    try {
      await assertUrlIsSafeForServerSideFetch(link.url);
    } catch (error) {
      if (!(error instanceof UnsafeUrlError)) {
        throw error;
      }
    }
  }

  if (
    link.url?.startsWith("http://") ||
    link.url?.startsWith("https://")
  ) {
    const headers = await fetchHeaders(link.url);
    const contentType = headers?.get("content-type");

    let linkType: "url" | "pdf" | "image" = "url";
    if (contentType?.includes("application/pdf")) {
      linkType = "pdf";
    } else if (contentType?.startsWith("image")) {
      linkType = "image";
    }

    await prisma.link.update({
      where: { id: link.id },
      data: { type: linkType },
    });
  }

  const finalLink = await prisma.link.findUnique({
    where: { id: link.id },
  });

  if (finalLink) {
    await prisma.link.update({
      where: { id: link.id },
      data: {
        lastPreserved: new Date().toISOString(),
        readable: !finalLink.readable ? "unavailable" : undefined,
        image: !finalLink.image ? "unavailable" : undefined,
        monolith: !finalLink.monolith ? "unavailable" : undefined,
        pdf: !finalLink.pdf ? "unavailable" : undefined,
        preview: !finalLink.preview ? "unavailable" : undefined,
        indexVersion: null,
      },
    });
  } else {
    await removeFiles(link.id, link.collectionId);
  }
}
