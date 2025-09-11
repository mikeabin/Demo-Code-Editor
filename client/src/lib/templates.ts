export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
}

export function getProjectTemplates(): ProjectTemplate[] {
  return [
    {
      id: "blank",
      name: "Blank Project",
      description: "Start with an empty project"
    },
    {
      id: "html5",
      name: "HTML5 Boilerplate",
      description: "Standard HTML5 structure with CSS and JavaScript"
    },
    {
      id: "landing",
      name: "Landing Page",
      description: "Modern landing page template"
    },
    {
      id: "portfolio",
      name: "Portfolio Site",
      description: "Portfolio website template"
    },
    {
      id: "blog",
      name: "Blog Template",
      description: "Simple blog layout"
    }
  ];
}
