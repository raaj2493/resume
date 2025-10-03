import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

const projects = [
  {
    title: "Habit Tracking App",
    description: "Flutter app with tile-based grid charts, customizable dashboards, and habit progress tracking.",
    tech: ["Flutter", "Firebase", "Charts"],
    featured: true,
  },
  {
    title: "Real-time Chat App",
    description: "Flutter + Firebase app with chat, user profiles, and push notifications.",
    tech: ["Flutter", "Firebase", "Cloud Messaging"],
    featured: true,
  },
  {
    title: "Task Manager App",
    description: "Group-based task management with CRUD functionality for team collaboration.",
    tech: ["Flutter", "Firebase", "Firestore"],
    featured: true,
  },
  {
    title: "Meme App",
    description: "Meme aggregation app scraping memes from social media with like/favorite feature.",
    tech: ["Flutter", "Web Scraping", "API"],
  },
  {
    title: "Marvel Characters App",
    description: "Flutter app displaying Marvel characters with detailed information and search.",
    tech: ["Flutter", "Marvel API", "REST"],
  },
  {
    title: "Book Management API",
    description: "Node.js + Express backend with push/get/delete methods for book data.",
    tech: ["Node.js", "Express", "REST API"],
  },
  {
    title: "Firebase CRUD Employee App",
    description: "CRUD operations on employee data including name, age, and location.",
    tech: ["Flutter", "Firebase", "Firestore"],
  },
  {
    title: "BMI Calculator",
    description: "Flutter app with input/result screens, chart visualization, and dark mode.",
    tech: ["Flutter", "Charts", "UI/UX"],
  },
  {
    title: "Laptop Recommendation App",
    description: "Suggests laptops for students based on their needs and budget.",
    tech: ["Flutter", "Recommendation System"],
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-32 px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="animate-fade-in-up space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Featured <span className="text-primary">Projects</span>
            </h2>
            <div className="h-1 w-24 bg-primary"></div>
            <p className="text-lg text-foreground/70 max-w-2xl">
              A showcase of my best work across mobile and web development
            </p>
          </div>
          
          {/* Featured Projects - Large Cards */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-primary uppercase tracking-wider">Top Picks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.filter(p => p.featured).map((project, index) => (
                <div
                  key={index}
                  className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                    <Play className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                  </div>
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Projects - Smaller Cards */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-primary uppercase tracking-wider">More Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => !p.featured).map((project, index) => (
                <Card
                  key={index}
                  className="group bg-card hover:bg-card/80 border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-netflix cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${(index + 3) * 0.05}s` }}
                >
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
