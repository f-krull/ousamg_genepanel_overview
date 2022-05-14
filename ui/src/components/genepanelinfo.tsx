import React = require("react");
import { Database } from "sql.js";
import { formatDate, naSymbol } from "../shared/format";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { Description } from "./description";
import { Section } from "./section";

export function GenepanelInfo({
  genepanelName,
  genepanelVersion,
  db,
}: {
  genepanelName: string;
  genepanelVersion: string;
  db: Database;
}) {
  const genes: genepanels.Gene[] = React.useMemo(() => {
    const g = genepanels.searchGenesByNameVersion(
      db,
      genepanelName,
      genepanelVersion
    );
    if (g === undefined) {
      throw Error(`no genes found for ${genepanelName} ${genepanelVersion}`);
    }
    return g;
  }, [genepanelName, genepanelVersion]);

  const gps = React.useMemo(() => genepanels.getGenepanels(db), []).filter(
    (g) => g.name === genepanelName
  );
  const currentGenepanel = React.useMemo(
    () => gps.filter((g) => g.version === genepanelVersion)[0],
    [genepanelName, genepanelVersion]
  );
  const otherGenepanels = React.useMemo(
    () => gps.filter((g) => g.version != currentGenepanel.version),
    []
  );

  return (
    <Section title="Gene panel">
      <div className="row gy-sm-2">
        <Description title="Gene panel name">
          {currentGenepanel.name}
        </Description>
        <Description title="Version">
          {currentGenepanel.version}{" "}
          {currentGenepanel.isLatest ? (
            ""
          ) : (
            <span className="small">(superseded)</span>
          )}
        </Description>
        <Description title="Date created">
          {currentGenepanel.dateCreated
            ? formatDate(currentGenepanel.dateCreated)
            : naSymbol}
        </Description>
        <Description title="Other versions">
          {otherGenepanels.length
            ? otherGenepanels.map((e, i) => (
                <span key={e.version} className="">
                  {i !== 0 ? ", " : ""}
                  <a href={Routes.Genepanel(e)}>{e.version}</a>
                  <span className="small">{e.isLatest ? "(latest)" : ""}</span>
                </span>
              ))
            : naSymbol}
          {otherGenepanels.length > 0 ? (
            <>
              {" "}
              <a
                role="button"
                className="btn btn-outline-secondary btn-sm small py-0"
                href={Routes.GenepanelDiff(
                  otherGenepanels[0],
                  currentGenepanel
                )}
              >
                compare
              </a>
            </>
          ) : (
            ""
          )}
        </Description>
        <Description title="Num. transcripts">
          {currentGenepanel.numRefseq}
        </Description>
      </div>
    </Section>
  );
}
