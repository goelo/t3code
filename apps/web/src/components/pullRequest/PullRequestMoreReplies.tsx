import { useGT, T } from "gt-react";
import type { PullRequestReplyAvailability } from "./pullRequestDetail.logic";

export function PullRequestMoreReplies({
  moreReplies,
  hasMoreReplies,
  url,
}: PullRequestReplyAvailability) {
  const gt = useGT();
  if (!hasMoreReplies) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-1 text-xs text-muted-foreground">
      <span>
        {moreReplies > 0
          ? gt("{value0} more {value1}", {
              value0: moreReplies.toLocaleString(),
              value1: moreReplies === 1 ? "reply" : "replies",
            })
          : gt("More replies")}
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          <T>View on host</T>
        </a>
      ) : null}
    </div>
  );
}
