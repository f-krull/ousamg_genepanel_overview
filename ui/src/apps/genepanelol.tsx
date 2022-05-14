import React = require("react");
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { GeneHit } from "../components/genehit";
import { GeneList } from "../components/genelist";
import { GenepanelInfo } from "../components/genepanelinfo";
import { Section } from "../components/section";
import { naSymbol } from "../shared/format";
import { Routes } from "../shared/routes";
import { geneinfo, genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";

function GenepanelOverlap({
  genepanelName,
  genepanelVersion,
  hgncIds,
  db,
}: {
  genepanelName: string;
  genepanelVersion: string;
  hgncIds: string[];
  db: Database;
}) {
  const genepanelHgncIds: string[] = React.useMemo(() => {
    const g = genepanels.searchGenesByNameVersion(
      db,
      genepanelName,
      genepanelVersion
    );
    if (g === undefined) {
      throw Error(`no genes found for ${genepanelName} ${genepanelVersion}`);
    }
    return g.map((e) => e.hgncId);
  }, [genepanelName, genepanelVersion]);

  const selGenesIncluded: string[] = React.useMemo(() => {
    return hgncIds.filter((e) => genepanelHgncIds.includes(e));
  }, [genepanelHgncIds, hgncIds]);

  const selGenesNotIncluded: string[] = React.useMemo(() => {
    return hgncIds.filter((e) => !genepanelHgncIds.includes(e));
  }, [genepanelHgncIds, hgncIds]);

  const gpGenesOther: string[] = React.useMemo(() => {
    return genepanelHgncIds.filter((e) => !hgncIds.includes(e));
  }, [genepanelHgncIds, hgncIds]);

  const selectedGenes: geneinfo.GeneInfoEntry[] = React.useMemo(
    () =>
      hgncIds
        .map((id) => geneinfo.searchByHgncId(db, id))
        .flat()
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [hgncIds]
  );

  return (
    <>
      <GenepanelInfo
        db={db}
        genepanelName={genepanelName}
        genepanelVersion={genepanelVersion}
      />
      <Section title="Selected gene set">
        <div className="row">
          {selectedGenes.map((g) => {
            return (
              <div key={g.hgncId} className="col">
                <GeneHit error={false}>
                  <a
                    href={Routes.Gene(g.hgncId)}
                    className="text-light text-decoration-none"
                  >
                    {`${g.symbol} (HGNC: ${g.hgncId}) ${g.name}`}
                  </a>
                </GeneHit>
              </div>
            );
          })}
        </div>
      </Section>
      <Section
        title={`Selected genes included in genepanel (${selGenesIncluded.length})`}
      >
        {selGenesIncluded.length ? (
          <GeneList
            domId="geneListIncluded"
            db={db}
            hgncIds={selGenesIncluded}
            displayFilter={false}
          />
        ) : (
          naSymbol
        )}
      </Section>
      <Section
        title={`Selected genes not included in genepanel (${selGenesNotIncluded.length})`}
      >
        {selGenesNotIncluded.length ? (
          <GeneList
            domId="geneListExcluded"
            db={db}
            hgncIds={selGenesNotIncluded}
            displayFilter={false}
          />
        ) : (
          naSymbol
        )}
      </Section>
      <Section
        title={`Gene panel genes not included in selection (${gpGenesOther.length})`}
      >
        {gpGenesOther.length ? (
          <GeneList
            domId="geneListGpOther"
            db={db}
            hgncIds={gpGenesOther}
            displayFilter={false}
          />
        ) : (
          naSymbol
        )}
      </Section>
      <div className="mb-5" />
    </>
  );
}

function GenepanelOverlapApp(props: any) {
  // get gene id
  const urlParams = new UrlParam();
  const genepanelName = urlParams.get("name");
  const genepanelVersion = urlParams.get("version");
  const hgncIds = urlParams.getList("hgnc_ids");

  return (
    <DbScaffold title="Gene Panel - Gene Set Overlap">
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
          if (hgncIds === undefined) {
            // TODO: set error
            return <>hgnc ids undefined</>;
          }
          return (
            <GenepanelOverlap
              db={db}
              genepanelName={genepanelName}
              genepanelVersion={genepanelVersion}
              hgncIds={hgncIds}
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
  root.render(<GenepanelOverlapApp />);
}
