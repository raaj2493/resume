import { Play, Github, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Hero background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 bg-gradient-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 pt-20">
        <div className="max-w-4xl animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight">
              ASHUTOSH GIRI
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-16 bg-primary"></div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-primary uppercase tracking-wider">
                Full Stack App Developer
              </p>
            </div>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl leading-relaxed">
              Building modern apps & scalable backends with Flutter, Node.js, and modern web technologies. 
              Transforming ideas into powerful digital experiences.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-8">
              <Button
                size="lg"
                onClick={() => scrollToSection("projects")}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 text-lg shadow-netflix hover:shadow-netflix hover:scale-105 transition-all"
              >
                <Play className="h-5 w-5 mr-2 fill-white" />
                View Projects
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("contact")}
                className="border-2 border-foreground/30 hover:border-foreground bg-transparent hover:bg-foreground/10 font-bold px-8 py-6 text-lg"
              >
                Get in Touch
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-6">
              <Button variant="ghost" size="icon" asChild className="hover:bg-foreground/10 hover:scale-110 transition-all">
                <a href="https://github.com/raaj2493" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-6 w-6" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild className="hover:bg-foreground/10 hover:scale-110 transition-all">
                <a href="https://www.linkedin.com/in/rajgiri2493/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-6 w-6" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild className="hover:bg-foreground/10 hover:scale-110 transition-all">
                <a href="mailto:raj.ash2493@gmail.com" aria-label="Email">
                  <Mail className="h-6 w-6" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
};

export default Hero;
