export namespace Routes {
  export const Home = "./index.html";
  export const Gene = "./gene.html";
  const _Genepanel = "./genepanel.html";

  export const Genepanel = (genepanelName: string) =>
    `${_Genepanel}?name=${encodeURIComponent(genepanelName)}`;
}
