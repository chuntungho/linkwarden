import archiveHandler from "../lib/archiveHandler";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import { delay } from "@linkwarden/lib/utils";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";
import { countUnprocessedBillableLinks } from "../lib/countUnprocessedBillableLinks";

const ARCHIVE_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

export async function linkProcessing(interval = 10) {
  console.log("\x1b[34m%s\x1b[0m", "Starting link processing...");

  while (true) {
    const links = await getLinkBatchFairly({
      maxBatchLinks: ARCHIVE_TAKE_COUNT,
      mode: "links",
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

    const processLink = async (link: LinkWithCollectionOwnerAndTags) => {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `- Link ${link.url} for user ${link.collection.ownerId}`
        );

        await archiveHandler(link);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded processing link ${link.url} for user ${link.collection.ownerId}.`
        );
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error processing link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );
      }
    };

    const processingPromises = links.map((e) => processLink(e));
    await Promise.allSettled(processingPromises);

    const unprocessedLinkCount = await countUnprocessedBillableLinks();

    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processed ${links.length} link${
        links.length === 1 ? "" : "s"
      }, ${unprocessedLinkCount} left.`
    );

    await delay(interval);
  }
}
