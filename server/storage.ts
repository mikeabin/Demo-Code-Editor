import { type Project, type InsertProject, type UpdateProject, type FileTree } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  getProjectFiles(id: string): Promise<FileTree | undefined>;
  updateProjectFiles(id: string, files: FileTree): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;

  constructor() {
    this.projects = new Map();
    
    // Create a default project
    const defaultProject: Project = {
      id: randomUUID(),
      name: "my-website",
      description: "A sample website project",
      template: "html5",
      files: {
        "index.html": {
          name: "index.html",
          type: "file",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>Welcome to My Website</h1>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h2>Build Amazing Websites</h2>
            <p>Start coding your dreams into reality.</p>
            <button>Get Started</button>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>`
        },
        "styles.css": {
          name: "styles.css",
          type: "file",
          content: `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Header styles */
header {
    background: #2c3e50;
    color: white;
    padding: 1rem 0;
}

nav h1 {
    text-align: center;
    font-size: 2rem;
}

/* Main content */
main {
    padding: 2rem 0;
}

.hero {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #666;
}

button {
    background: #3498db;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;
}

button:hover {
    background: #2980b9;
}`
        },
        "script.js": {
          name: "script.js",
          type: "file",
          content: `// Welcome to your new project!
console.log('Website loaded successfully!');

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button');
    
    if (button) {
        button.addEventListener('click', function() {
            alert('Welcome to web development! Start building amazing things!');
        });
    }
});`
        },
        "assets": {
          name: "assets",
          type: "folder",
          children: {}
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.projects.set(defaultProject.id, defaultProject);
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    
    const templates = {
      blank: {},
      html5: {
        "index.html": {
          name: "index.html",
          type: "file" as const,
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${insertProject.name}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome to ${insertProject.name}</h1>
    <p>Start building your website here!</p>
    <script src="script.js"></script>
</body>
</html>`
        },
        "styles.css": {
          name: "styles.css",
          type: "file" as const,
          content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f4f4;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    text-align: center;
    font-size: 18px;
    color: #666;
}`
        },
        "script.js": {
          name: "script.js",
          type: "file" as const,
          content: `console.log('${insertProject.name} loaded!');`
        }
      }
    };

    const project: Project = {
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      template: insertProject.template || "blank",
      files: templates[insertProject.template as keyof typeof templates] || templates.blank,
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: UpdateProject): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };

    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getProjectFiles(id: string): Promise<FileTree | undefined> {
    const project = this.projects.get(id);
    return project?.files as FileTree;
  }

  async updateProjectFiles(id: string, files: FileTree): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;

    project.files = files;
    project.updatedAt = new Date();
    return true;
  }
}

export const storage = new MemStorage();
