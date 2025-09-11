import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, updateProjectSchema, fileSchema, type FileTree, type FileNode } from "@shared/schema";
import { z } from "zod";
import AdmZip from "adm-zip";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validated = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, validated);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Get project files
  app.get("/api/projects/:id/files", async (req, res) => {
    try {
      const files = await storage.getProjectFiles(req.params.id);
      if (!files) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project files" });
    }
  });

  // Update project files
  app.put("/api/projects/:id/files", async (req, res) => {
    try {
      const validated = z.record(fileSchema).parse(req.body);
      const updated = await storage.updateProjectFiles(req.params.id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Files updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update files" });
    }
  });

  // Serve project preview
  app.get("/api/projects/:id/preview", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const indexFile = (project.files as FileTree)["index.html"];
      if (!indexFile || indexFile.type !== "file") {
        return res.status(404).send("<!DOCTYPE html><html><body><h1>No index.html found</h1></body></html>");
      }

      // Replace relative links with API endpoints
      let html = indexFile.content || "";
      
      // Replace CSS links
      html = html.replace(/href="([^"]+\.css)"/g, (_match: string, filename: string) => {
        return `href="/api/projects/${req.params.id}/assets/${filename}"`;
      });
      
      // Replace JS links
      html = html.replace(/src="([^"]+\.js)"/g, (_match: string, filename: string) => {
        return `src="/api/projects/${req.params.id}/assets/${filename}"`;
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).send("<!DOCTYPE html><html><body><h1>Error loading preview</h1></body></html>");
    }
  });

  // Serve project assets
  app.get("/api/projects/:id/assets/:filename", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const file = (project.files as FileTree)[req.params.filename];
      if (!file || file.type !== "file") {
        return res.status(404).json({ message: "File not found" });
      }

      // Set appropriate content type
      const filename = req.params.filename;
      if (filename.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filename.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }

      res.send(file.content);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve asset" });
    }
  });

  // Download project as ZIP
  app.get("/api/projects/:id/download", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const zip = new AdmZip();
      const files = project.files as FileTree;
      
      // Function to add files/folders to zip recursively
      const addToZip = (node: FileNode, path: string = "") => {
        if (node.type === "file" && node.content !== undefined) {
          zip.addFile(path + node.name, Buffer.from(node.content, "utf8"));
        } else if (node.type === "folder" && node.children) {
          Object.entries(node.children).forEach(([childName, childNode]) => {
            addToZip(childNode, path + node.name + "/");
          });
        }
      };

      // Add all files to zip
      Object.entries(files).forEach(([fileName, fileNode]) => {
        addToZip(fileNode);
      });

      const zipBuffer = zip.toBuffer();
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create download" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
