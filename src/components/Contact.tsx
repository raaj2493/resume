import { Mail, Github, Linkedin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import sectionBg from "@/assets/section-bg.jpg";

const Contact = () => {
  return (
    <section id="contact" className="relative py-32 px-4 md:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={sectionBg} 
          alt="Contact background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl">
        <div className="animate-fade-in-up space-y-12 text-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Let's <span className="text-primary">Connect</span>
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto"></div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Ready to build something amazing together? Let's discuss your next project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <a
              href="mailto:your.email@example.com"
              className="group bg-card border border-border hover:border-primary/50 rounded-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-netflix"
            >
              <Mail className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Email</h3>
              <p className="text-foreground/70 group-hover:text-foreground transition-colors">Drop me a line</p>
            </a>

            <a
              href="https://github.com/raaj2493"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border border-border hover:border-primary/50 rounded-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-netflix"
            >
              <Github className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">GitHub</h3>
              <p className="text-foreground/70 group-hover:text-foreground transition-colors">Check my code</p>
            </a>

            <a
              href="https://www.linkedin.com/in/rajgiri2493/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border border-border hover:border-primary/50 rounded-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-netflix"
            >
              <Linkedin className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">LinkedIn</h3>
              <p className="text-foreground/70 group-hover:text-foreground transition-colors">Let's network</p>
            </a>
          </div>

          <div className="pt-8">
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/90 text-white font-bold px-12 py-6 text-lg shadow-netflix hover:shadow-netflix hover:scale-105 transition-all group"
            >
              <a href="mailto:raj.ash2493@gmail.com" className="flex items-center gap-2">
                Start a Conversation
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
