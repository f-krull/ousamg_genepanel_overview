import * as React from "react";
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";
import { Section } from "../components/section";
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

  return (
    <>
      <Section title="Gene panel">
        <div className="row gy-sm-2">
          <Description title="Gene panel name">{genepanelName}</Description>
          <Description title="Gene panel version">
            {genepanelVersion}
          </Description>
        </div>
      </Section>
      <Section title="Genes">
        <div className="row p-2">
          {genes?.map((e) => (
            <div
              key={e.hgnc_id}
              className="col-4 col-lg-2 col-md-3 text-truncate"
            >
              <a href={Routes.Gene(e.hgnc_id)}>
                {e.symbol} ({e.hgnc_id})
              </a>
            </div>
          ))}
        </div>
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
