import { genepanels } from "../shared/sql";

export namespace Routes {
  export const Home = "./inpgene.html";
  export const InpGenes = "./inpgenes.html";
  export const InpGenepanel = "./inpgenepanel.html";
  const _Gene = "./gene.html";
  const _Genes = "./genes.html";
  const _Genepanel = "./genepanel.html";
  const _GenepanelDiff = "./diffgenepanel.html";
  const _GenepanelGeneOverlap = "./genepanelol.html";

  export const Gene = (id: string) =>
    `${_Gene}?hgnc_id=${encodeURIComponent(id)}`;

  export const Genepanel = (genepanelId: genepanels.GenepanelId) =>
    `${_Genepanel}?name=${encodeURIComponent(
      genepanelId.name
    )}&version=${encodeURIComponent(genepanelId.version)}`;
  export const Genes = (hgncIds: string[]) =>
    `${_Genes}?hgnc_ids=${encodeURIComponent(hgncIds.join(","))}`;

  export const GenepanelGeneOverlap = (
    genepanelId: genepanels.GenepanelId,
    hgncIds: string[]
  ) =>
    `${_GenepanelGeneOverlap}?name=${encodeURIComponent(
      genepanelId.name
    )}&version=${encodeURIComponent(
      genepanelId.version
    )}&hgnc_ids=${encodeURIComponent(hgncIds.join(","))}`;

  export const GenepanelDiff = (
    a?: genepanels.GenepanelId,
    b?: genepanels.GenepanelId
  ) => {
    {
    }
    if (!a || !b) {
      // actually too conservative
      return _GenepanelDiff;
    }
    return `${_GenepanelDiff}?a_name=${encodeURIComponent(
      a.name
    )}&a_version=${encodeURIComponent(a.version)}&b_name=${encodeURIComponent(
      b.name
    )}&b_version=${encodeURIComponent(b.version)}`;
  };
}
