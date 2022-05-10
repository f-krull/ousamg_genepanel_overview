import * as React from "react";
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";
import { GeneList } from "../components/genelist";
import { Section } from "../components/section";
import { formatDate, naSymbol } from "../shared/format";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";

function GenepanelInfo({
  genepanelName,
  genepanelVersion,
  db,
}: {
  genepanelName: string;
  genepanelVersion: string;
  db: Database;
}) {
  const genes: genepanels.Gene[] | undefined = React.useMemo(() => {
    return genepanels.searchGenesByNameVersion(
      db,
      genepanelName,
      genepanelVersion
    );
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
  const latestGenepanel = React.useMemo(
    () => gps.filter((g) => g.isLatest)[0],
    []
  );

  return (
    <>
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
            {otherGenepanels.map((e, i) => (
              <span key={e.version} className="">
                {i !== 0 ? ", " : ""}
                <a href={Routes.Genepanel(e)}>{e.version}</a>
                <span className="small">{e.isLatest ? "(latest)" : ""}</span>
              </span>
            ))}
            {otherGenepanels.length > 0 ? (
              <>
                {" "}
                <a
                  role="button"
                  // className="ms-2 badge bg-secondary text-light text-decoration-none"
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
        </div>
      </Section>
      <Section title="Genes">
        <GeneList db={db} hgncIds={genes?.map((e) => e.hgncId) || []} />
      </Section>
    </>
  );
}

function GeneApp(props: any) {
  // get gene id
  const urlParams = new UrlParam();
  const genepanelName = urlParams.get("name");
  const genepanelVersion = urlParams.get("version");

  return (
    <DbScaffold title="Gene Panel">
      {/* <AppStateContext.Consumer>
        {(value) => <h1>{value}</h1>}
      </AppStateContext.Consumer> */}
      <DbContext.Consumer>
        {(db) => {
          if (!genepanelName) {
            // TODO: set error
            return <>no genepanel name defined</>;
          }
          if (!genepanelVersion) {
            // TODO: set error
            return <>no genepanel version defined</>;
          }
          return (
            <GenepanelInfo
              db={db}
              genepanelName={genepanelName}
              genepanelVersion={genepanelVersion}
            />
          );
        }}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<GeneApp />);
}
