import { Database } from "sql.js";
import * as React from "react";
import { MenuPages } from "../components/scaffold";
import { createRoot } from "react-dom/client";
import { genenames } from "../shared/sql";
import { Routes } from "../shared/routes";
import { DbContext, DbScaffold } from "../components/dbscaffold";

interface GeneLookupStatus {
  [k: string]: {
    index: number;
    data: genenames.GenenameEntry[];
  };
}

function GeneHit({
  children,
  error,
}: {
  children: React.ReactNode;
  error: boolean;
}) {
  return (
    <div className="col-12">
      <span className={`badge rounded-pill bg-${error ? "danger" : "success"}`}>
        {children}
      </span>
    </div>
  );
}

function InpGenesApp(props: any) {
  const [geneLookupStatus, setGeneLookupStatus] =
    React.useState<GeneLookupStatus>({});

  const numFound = Object.values(geneLookupStatus).filter(
    (v) => v.data.length !== 0
  ).length;
  const numSearched = Object.keys(geneLookupStatus).length;

  return (
    <DbScaffold title="Multi Gene Search" currentPage={MenuPages.searchGenes}>
      <DbContext.Consumer>
        {(db) => (
          <div className="mb-3 row g-5">
            <div className="col-6 mb-3">
              <div className="mb-3">
                <label htmlFor="inpGenesymbol" className="form-label my-1">
                  Gene symbols / HGNC IDs:
                </label>
                <textarea
                  className="form-control"
                  id="inpGenesymbol"
                  placeholder="BRCA2, NOTCH1, 3808"
                  rows={10}
                  onInput={(e) => {
                    const isNumeric = (str: string): boolean => {
                      return RegExp("^[0-9]+$").test(str);
                    };
                    const q = e.currentTarget.value;
                    // split into sep words - delimiters: " " and ","
                    const words: string[] = q
                      .replace(/,/g, " ")
                      .replace(/\n/g, " ")
                      .split(" ")
                      .map((e) => e.trim())
                      .filter((e) => e !== "");
                    // init new dict
                    const glsUpdated: GeneLookupStatus = {};
                    words.forEach((w, index) => {
                      if (geneLookupStatus.hasOwnProperty(w)) {
                        // already defined?
                        glsUpdated[w] = geneLookupStatus[w];
                      } else if (isNumeric(w[0])) {
                        // hgnc ID?
                        glsUpdated[w] = {
                          index,
                          data: genenames.searchByHgncId(db, w),
                        };
                      } else {
                        // assume gene
                        glsUpdated[w] = {
                          index,
                          data: genenames.searchByGeneSymbol(
                            db,
                            w.toUpperCase()
                          ),
                        };
                      }
                    });
                    setGeneLookupStatus(glsUpdated);
                  }}
                />
              </div>
              <div
                role="button"
                className="btn btn-primary my-2"
                onClick={() => {
                  const ids = Object.values(geneLookupStatus)
                    .map((g) => g.data)
                    .flat()
                    .map((g) => g.hgncId);
                  window.location.assign(Routes.Genes(ids));
                }}
              >
                Select genes
              </div>
              <span
                className={`${
                  numFound !== numSearched ? "bg-warning" : ""
                } mx-2 p-1 rounded`}
              >
                {numFound}/{numSearched} genes found
              </span>
            </div>
            <div className="col-6">
              <div className="row">
                {Object.values(geneLookupStatus).length > 0 && (
                  <span>Requested genes:</span>
                )}
                <ol>
                  {Object.entries(geneLookupStatus)
                    .sort(([, a], [, b]) => a.index - b.index)
                    .map(([query, results]) => {
                      if (results.data.length === 0) {
                        return [
                          <li key={query} className="">
                            <GeneHit error={true}>{query}</GeneHit>
                          </li>,
                        ];
                      }
                      return results.data.map((result) => {
                        return (
                          <li key={query} className="">
                            <GeneHit error={false}>
                              <a
                                href={Routes.Gene(result.hgncId)}
                                className="text-light text-decoration-none"
                              >
                                {`${result.symbol} (HGNC: ${result.hgncId}) ${result.name}`}
                              </a>
                            </GeneHit>
                          </li>
                        );
                      });
                    })
                    .flat()}
                </ol>
              </div>
            </div>
          </div>
        )}
      </DbContext.Consumer>
    </DbScaffold>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<InpGenesApp />);
}
