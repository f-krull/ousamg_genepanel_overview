export namespace Routes {
  export const Home = "./index.html";
  export const InpGenes = "./inpgenes.html";
  const _Gene = "./gene.html";
  const _Genes = "./genes.html";
  const _Genepanel = "./genepanel.html";

  export const Gene = (id: string) =>
    `${_Gene}?hgncId=${encodeURIComponent(id)}`;

  export const Genepanel = (genepanelName: string, genepanelVersion: string) =>
    `${_Genepanel}?name=${encodeURIComponent(
      genepanelName
    )}&version=${encodeURIComponent(genepanelVersion)}`;
  export const Genes = (ids: string[]) =>
    `${_Genes}?hgncIds=${encodeURIComponent(ids.join(","))}`;
}
