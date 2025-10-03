import { Code2, Database, Server, Smartphone, Cloud, GitBranch } from "lucide-react";

const skills = [
  {
    category: "Mobile Development",
    icon: Smartphone,
    techs: ["Flutter", "Cross-platform Apps", "Mobile UI/UX"],
  },
  {
    category: "Backend Development",
    icon: Server,
    techs: ["Node.js", "Express.js", "REST APIs"],
  },
  {
    category: "Databases",
    icon: Database,
    techs: ["PostgreSQL", "MySQL", "MongoDB", "Firestore"],
  },
  {
    category: "Frontend",
    icon: Code2,
    techs: ["React.js", "Next.js", "Tailwind CSS"],
  },
  {
    category: "Cloud & Services",
    icon: Cloud,
    techs: ["Firebase", "AWS/GCP (Learning)", "Cloud Messaging"],
  },
  {
    category: "Tools & Learning",
    icon: GitBranch,
    techs: ["Docker (Learning)", "Prisma", "TypeORM", "Sequelize"],
  },
];

const Skills = () => {
  return (
    <section id="skills" className="py-32 px-4 md:px-8 bg-secondary/50">
      <div className="container mx-auto max-w-7xl">
        <div className="animate-fade-in-up space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Tech <span className="text-primary">Stack</span>
            </h2>
            <div className="h-1 w-24 bg-primary"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => {
              const Icon = skill.icon;
              return (
                <div
                  key={index}
                  className="group bg-card rounded-lg p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-netflix cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                        {skill.category}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {skill.techs.map((tech, techIndex) => (
                        <li key={techIndex} className="text-foreground/70 flex items-center gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform"></span>
                          <span className="group-hover:text-foreground transition-colors">{tech}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
