import { genepanels } from "../shared/sql";

export namespace Routes {
  export const Home = "./index.html";
  export const InpGenes = "./inpgenes.html";
  export const InpGenepanel = "./inpgenepanel.html";
  const _Gene = "./gene.html";
  const _Genes = "./genes.html";
  const _Genepanel = "./genepanel.html";
  const _GenepanelDiff = "./diffgenepanel.html";

  export const Gene = (id: string) =>
    `${_Gene}?hgnc_id=${encodeURIComponent(id)}`;

  export const Genepanel = (genepanelId: genepanels.GenepanelId) =>
    `${_Genepanel}?name=${encodeURIComponent(
      genepanelId.name
    )}&version=${encodeURIComponent(genepanelId.version)}`;
  export const Genes = (ids: string[]) =>
    `${_Genes}?hgnc_ids=${encodeURIComponent(ids.join(","))}`;

  export const GenepanelDiff = (
    a?: genepanels.GenepanelId,
    b?: genepanels.GenepanelId
  ) => {
    {
    }
    if (!a || !b) {
      // too conservative
      return _GenepanelDiff;
    }
    return `${_GenepanelDiff}?a_name=${encodeURIComponent(
      a.name
    )}&a_version=${encodeURIComponent(a.version)}&b_name=${encodeURIComponent(
      b.name
    )}&b_version=${encodeURIComponent(b.version)}`;
  };
}
