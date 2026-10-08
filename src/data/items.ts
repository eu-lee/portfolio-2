import { parse } from "yaml";

export type ObjectItem = {
  id: string;
  title: string;
  hoverLabel: string;
  image: string;
  imageAlt: string;
  description: string;
  order: number;
  size: number;
  labelGap: number;
  initial: { x: number; y: number };
};

const metadata = import.meta.glob<string>("../../media/items/*.yaml", {
  eager: true, query: "?raw", import: "default",
});
const images = import.meta.glob<string>("../../media/items/*.png", {
  eager: true, query: "?url", import: "default",
});

export const objects: ObjectItem[] = Object.entries(metadata).map(([path, source]) => {
  const data = parse(source);
  const fail = (message: string): never => { throw new Error(`${path}: ${message}`); };
  if (!data || typeof data !== "object") fail("Expected item metadata.");
  for (const key of ["title", "hoverLabel", "image", "imageAlt", "description"]) {
    if (typeof data[key] !== "string" || !data[key].trim()) fail(`Missing or empty ${key}.`);
  }
  for (const key of ["order", "size", "labelGap"]) {
    if (typeof data[key] !== "number" || !Number.isFinite(data[key])) fail(`Invalid ${key}.`);
  }
  if (data.size <= 0 || data.labelGap < 0) fail("Size must be positive and labelGap nonnegative.");
  for (const axis of ["x", "y"]) {
    if (typeof data.initial?.[axis] !== "number" || !Number.isFinite(data.initial[axis])) fail(`Invalid initial.${axis}.`);
  }
  const image = images[`../../media/items/${data.image}`];
  if (!image) fail(`Image not found: ${data.image}`);
  return {
    ...data,
    id: path.split("/").pop()!.replace(/\.yaml$/, ""),
    image,
  } as ObjectItem;
}).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
