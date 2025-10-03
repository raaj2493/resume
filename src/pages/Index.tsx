import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="relative">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <footer className="py-12 px-4 border-t border-border/50 bg-secondary/30">
        <div className="container mx-auto text-center space-y-4">
          <p className="text-primary font-bold text-xl uppercase tracking-wider">Ashutosh Giri</p>
          <p className="text-foreground/60">
            © 2025 All rights reserved. Built with React, TypeScript & Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
