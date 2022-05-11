import React = require("react");
import { Database } from "sql.js";
import { Tabulator } from "tabulator-tables";
import { formatDate, formatDateFn } from "../shared/format";
import { version } from "../shared/sql";

export function DownloadTable({
  db,
  table,
  fn,
}: {
  fn: string;
  table: Tabulator;
  db: Database;
}) {
  return (
    <div
      className="btn btn-outline-primary btn-sm w-100"
      itemType="button"
      onClick={() => {
        const v = version.getVersion(db);
        table.download(
          "csv",
          `gpov_${v.sha1.substring(0, 7)}_${formatDate(
            v.date
          )}_${fn}_${formatDateFn()}.csv`,
          { delimiter: ";" }
        );
      }}
    >
      Download
    </div>
  );
}
