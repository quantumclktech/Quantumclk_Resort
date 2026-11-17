import manifest from "../../public/assets/resort/asset-manifest.json";

export type Scene = { src: string; width: number; height: number };
export const impression = "Artist’s impression. Design subject to change.";
export const logo = "/assets/resort/logo/provisional-catalogue-page-11-color-logo.png";
export const logoLight = "/assets/resort/logo/provisional-catalogue-page-11-light-logo.png";

export function getScene(id: string): Scene {
  const asset = manifest.assets.find((item) => item.id === id);
  if (!asset) throw new Error(`Missing resort scene: ${id}`);
  return {
    src: `/${asset.web.path.replace(/^public\//, "")}`,
    width: asset.web.width,
    height: asset.web.height,
  };
}
