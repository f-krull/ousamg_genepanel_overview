import * as React from "react";
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { Description } from "../components/description";
import { GeneList } from "../components/genelist";
import { GenepanelInfo } from "../components/genepanelinfo";
import { MenuPages } from "../components/scaffold";
import { Section } from "../components/section";
import { formatDate, naSymbol } from "../shared/format";
import { Routes } from "../shared/routes";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";

function GenepanelPage({
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

  // gets changed by filter
  const [numShownGenes, setNumShownGenes] = React.useState<number>(
    genes.length
  );

  return (
    <>
      <GenepanelInfo
        db={db}
        genepanelName={genepanelName}
        genepanelVersion={genepanelVersion}
      />
      <Section
        title={`Genes (${
          numShownGenes !== genes.length ? `showing ${numShownGenes}/` : ""
        }${genes.length})`}
      >
        <GeneList
          db={db}
          hgncIds={genes?.map((e) => e.hgncId) || []}
          onUpdateFilter={(e) => {
            setNumShownGenes(e.length);
          }}
        />
      </Section>
    </>
  );
}

function GenepanelApp(props: any) {
  // get gene id
  const urlParams = new UrlParam();
  const genepanelName = urlParams.get("name");
  const genepanelVersion = urlParams.get("version");

  return (
    <DbScaffold title="Gene Panel" currentPage={MenuPages.searchGenepanel}>
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
            <GenepanelPage
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
  root.render(<GenepanelApp />);
}
