import * as React from "react";
import { createRoot } from "react-dom/client";
import { Database } from "sql.js";
import { DbContext, DbScaffold } from "../components/dbscaffold";
import { MenuPages } from "../components/scaffold";
import { Section } from "../components/section";
import { Routes } from "../shared/routes";
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
  let count: { ins: number; del: number } = { del: 0, ins: 0 };
  while (ia < regA.length || ib < regB.length) {
    if (ia >= regA.length) {
      diff.push({ right: toDiffStr(regB[ib]) });
      ib++;
      count.ins++;
      continue;
    }
    if (ib >= regB.length) {
      diff.push({ left: toDiffStr(regA[ia]) });
      ia++;
      count.del++;
      continue;
    }
    if (regA[ia].refseqId < regB[ib].refseqId) {
      diff.push({ left: toDiffStr(regA[ia]) });
      count.del++;
      ia++;
      continue;
    }
    if (regA[ia].refseqId > regB[ib].refseqId) {
      diff.push({ right: toDiffStr(regB[ib]) });
      count.ins++;
      ib++;
      continue;
    }
    diff.push({ left: toDiffStr(regA[ia]), right: toDiffStr(regB[ib]) });
    ia++;
    ib++;
  }

  const getUrl = (gp: genepanels.GenepanelId) => {
    return <a href={Routes.Genepanel(gp)}>{`${gp.name}_${gp.version}`}</a>;
  };

  return (
    <Section title={`Comparing gene panels`}>
      <div className="row text-center">
        <div className="col">
          <span
            className="fw-bold small"
            style={count.del ? { color: "red" } : { color: "grey" }}
          >
            -{count.del}
          </span>
          /
          <span
            className="fw-bold small"
            style={count.ins ? { color: "green" } : { color: "grey" }}
          >
            +{count.ins}
          </span>
        </div>
      </div>
      <div className="d-flex justify-content-center mb-3">
        <table className="font-monospace small">
          <thead>
            <tr className="fw-bold text-center border-bottom">
              <td></td>
              <th>{getUrl(gpA)}</th>
              <th>{getUrl(gpB)}</th>
            </tr>
          </thead>
          <tbody>
            {diff.map((e, i) => {
              const isDel = e.right === undefined;
              const isIns = e.left === undefined;
              return (
                <tr key={i.toString()}>
                  <td className="text-muted px-2 text-end border-start border-end">
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
  const versionsA = React.useMemo(
    () => gps.filter((e) => e.name === selAName).map((e) => e.version),
    [gps, selAName]
  );
  const versionsB = React.useMemo(
    () => gps.filter((e) => e.name === selBName).map((e) => e.version),
    [gps, selBName]
  );

  // update url
  React.useEffect(() => {
    if (!selAName || !selAVersion || !selBName || !selBVersion) {
      return;
    }
    const url = Routes.GenepanelDiff(
      {
        name: selAName,
        version: selAVersion,
      },
      {
        name: selBName,
        version: selBVersion,
      }
    );
    window.history.pushState({}, "", url);
  }, [selAName, selAVersion, selBName, selBVersion]);

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
              value={selAName}
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
              value={selAVersion}
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
              value={selBName}
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
              value={selBVersion}
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
    <DbScaffold title="Gene Panel Diff" currentPage={MenuPages.diffGenepanel}>
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
