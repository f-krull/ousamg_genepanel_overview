import * as React from "react";
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { MenuPages } from "../components/scaffold";
import { Section } from "../components/section";
import { genepanels } from "../shared/sql";
import { UrlParam } from "../shared/urlParam";

interface DiffEntry {
  left?: string;
  right?: string;
}

function GenepanelDiffView({
  db,
  gpA,
  gpB,
}: {
  db: Database;
  gpA: genepanels.GenepanelId;
  gpB: genepanels.GenepanelId;
}) {
  const regA = React.useMemo(
    () => genepanels.getGenepanelRegionsByNameVersion(db, gpA),
    [gpA]
  );
  const regB = React.useMemo(
    () => genepanels.getGenepanelRegionsByNameVersion(db, gpB),
    [gpB]
  );
  const diff: DiffEntry[] = [];
  const toDiffStr = (e: genepanels.GenepanelGeneEntry) =>
    `${e.refseqId}, ${e.hgncId}, ${e.geneSymbol}`;
  let ia = 0;
  let ib = 0;
  while (ia < regA.length || ib < regB.length) {
    if (ia >= regA.length) {
      diff.push({ right: toDiffStr(regB[ib]) });
      ib++;
      continue;
    }
    if (ib >= regB.length) {
      diff.push({ left: toDiffStr(regA[ia]) });
      ia++;
      continue;
    }
    if (regA[ia].refseqId < regB[ib].refseqId) {
      diff.push({ left: toDiffStr(regA[ia]) });
      ia++;
      continue;
    }
    if (regA[ia].refseqId > regB[ib].refseqId) {
      diff.push({ right: toDiffStr(regB[ib]) });
      ib++;
      continue;
    }
    diff.push({ left: toDiffStr(regA[ia]), right: toDiffStr(regB[ib]) });
    ia++;
    ib++;
  }

  return (
    <Section
      title={`Comparing ${gpA.name}_${gpA.version} with ${gpB.name}_${gpB.version}`}
    >
      <div className="d-flex justify-content-center mb-3">
        <table className="font-monospace small">
          <thead>
            <tr className="fw-bold text-center border-bottom">
              <td></td>
              <th>{`${gpA.name}_${gpA.version}`}</th>
              <th>{`${gpB.name}_${gpB.version}`}</th>
            </tr>
          </thead>
          <tbody>
            {diff.map((e, i) => {
              const isDel = e.right === undefined;
              const isIns = e.left === undefined;
              return (
                <tr key={i.toString()}>
                  <td className="text-muted px-2 border-start border-end">
                    {i + 1}
                  </td>
                  <td
                    className=" px-2"
                    style={isDel ? { backgroundColor: "#FFC0CB" } : {}}
                  >
                    {e.left}
                  </td>
                  <td
                    className="border-start border-end  px-2  "
                    style={isIns ? { backgroundColor: "#CCFFCC" } : {}}
                  >
                    {e.right}
                  </td>
                </tr>
              );
            })}

            <tr className="border-bottom"></tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function GenepanelDiff({
  gpA,
  gpB,
  db,
}: {
  db: Database;
  gpA: Partial<genepanels.GenepanelId>;
  gpB: Partial<genepanels.GenepanelId>;
}) {
  // get avaible genepanel names
  const gps: genepanels.Genepanel[] = React.useMemo<genepanels.Genepanel[]>(
    () => genepanels.getGenepanels(db),
    []
  );

  // state
  const [selAName, setSelAName] = React.useState<string | undefined>(gpA.name);
  const [selAVersion, setSelAVersion] = React.useState<string | undefined>(
    gpA.version
  );
  const [selBName, setSelBName] = React.useState<string | undefined>(gpB.name);
  const [selBVersion, setSelBVersion] = React.useState<string | undefined>(
    gpB.version
  );

  // get unique list of names
  const genepanelNames = Array.from(new Set(gps.map((e) => e.name))).sort();
  // get avaible versions per genepanel
  const versionsA = gps
    .filter((e) => e.name === selAName)
    .map((e) => e.version);
  const versionsB = gps
    .filter((e) => e.name === selBName)
    .map((e) => e.version);

  return (
    <>
      <Section title={`Select gene panels`}>
        <div className="row g-2">
          <div className="col-md-4">
            <label htmlFor="inpGpAName" className="form-label">
              Gene panel name A
            </label>
            <select
              id="inpGpAName"
              className="form-select"
              defaultValue={selAName}
              onChange={(e) => {
                const name = e.currentTarget.value;
                setSelAName(name);
                const version = gps
                  .filter((e) => e.name === name)
                  .filter((e) => e.isLatest)
                  .pop()?.version;
                setSelAVersion(version);
              }}
            >
              {" "}
              <option></option>
              {genepanelNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label htmlFor="inpGpAVersion" className="form-label">
              Version A
            </label>
            <select
              id="inpGpAVersion"
              className="form-select"
              defaultValue={selAVersion}
              onChange={(e) => {
                const version = e.currentTarget.value;
                setSelAVersion(version);
              }}
            >
              {versionsA.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="inpGpBName" className="form-label">
              Gene panel name B
            </label>
            <select
              id="inpGpBName"
              className="form-select"
              defaultValue={selAName}
              onChange={(e) => {
                const name = e.currentTarget.value;
                setSelBName(name);
                const version = gps
                  .filter((e) => e.name === name)
                  .filter((e) => e.isLatest)
                  .pop()?.version;
                setSelBVersion(version);
              }}
            >
              {" "}
              <option></option>
              {genepanelNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label htmlFor="inpGpBVersion" className="form-label">
              Version B
            </label>
            <select
              id="inpGpBVersion"
              className="form-select"
              defaultValue={selBVersion}
              onChange={(e) => {
                const version = e.currentTarget.value;
                setSelBVersion(version);
              }}
            >
              {versionsB.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>
      {selAName && selBName && selAVersion && selBVersion && (
        <GenepanelDiffView
          db={db}
          gpA={{ name: selAName, version: selAVersion }}
          gpB={{ name: selBName, version: selBVersion }}
        />
      )}
    </>
  );
}

function GenepanelDiffApp(props: any) {
  // get gene id
  const urlParams = new UrlParam();
  const aGenepanelName = urlParams.get("a_name");
  const aGenepanelVersion = urlParams.get("a_version");
  const bGenepanelName = urlParams.get("b_name");
  const bGenepanelVersion = urlParams.get("b_version");

  return (
    <DbScaffold title="Gene Panel Diff" currentPage={MenuPages.genepanelDiff}>
      <DbContext.Consumer>
        {(db) => {
          return (
            <GenepanelDiff
              db={db}
              gpA={{ name: aGenepanelName, version: aGenepanelVersion }}
              gpB={{ name: bGenepanelName, version: bGenepanelVersion }}
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
  root.render(<GenepanelDiffApp />);
}
