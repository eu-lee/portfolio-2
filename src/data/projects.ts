import { parse } from "yaml";

type ProjectLink = { label: string; href: string };
export type Project = {
  id: string;
  title: string;
  summary: string;
  thumbnail: string;
  description: string;
  links: ProjectLink[];
  date: string;
  order: number | null;
};

const files = import.meta.glob<string>("../../media/projects/*.md", {
  eager: true, query: "?raw", import: "default",
});
const images = import.meta.glob<string>("../../media/projects/*.{png,jpg,jpeg,webp,avif,svg}", {
  eager: true, query: "?url", import: "default",
});

export const projects: Project[] = Object.entries(files).map(([path, source]) => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!frontmatter) throw new Error(`${path}: missing project frontmatter`);
  const data = parse(frontmatter[1]);
  for (const key of ["title", "cover", "date"]) {
    if (typeof data?.[key] !== "string" || !data[key].trim()) {
      throw new Error(`${path}: missing ${key}`);
    }
  }
  const videoId = data.cover.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)?.[1];
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : images[`../../media/projects/${data.cover}`];
  if (!thumbnail) throw new Error(`${path}: unknown cover ${data.cover}`);
  const links: ProjectLink[] = (data.links ?? []).filter(
    (link: ProjectLink) => typeof link.href === "string" && /^https?:\/\//.test(link.href),
  );
  if (!links.length) throw new Error(`${path}: missing project link`);
  return {
    id: path.split("/").pop()!.replace(/\.md$/, ""),
    title: data.title,
    summary: typeof data.summary === "string" ? data.summary : "",
    thumbnail,
    description: source.slice(frontmatter[0].length).trim(),
    links,
    date: data.date,
    order: typeof data.order === "number" ? data.order : null,
  };
}).sort((a, b) =>
  (a.order ?? Infinity) - (b.order ?? Infinity)
  || b.date.localeCompare(a.date)
  || a.id.localeCompare(b.id),
);
