export type Project = {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  href?: string;
};

// Display order matters: the first three projects appear on the homepage.
// Replace these placeholders with real project details and local image imports.
export const projects: Project[] = [
  {
    id: "project-01",
    title: "Project 01",
    description: "Project details coming soon.",
    tags: [],
  },
  {
    id: "project-02",
    title: "Project 02",
    description: "Project details coming soon.",
    tags: [],
  },
  {
    id: "project-03",
    title: "Project 03",
    description: "Project details coming soon.",
    tags: [],
  },
];
