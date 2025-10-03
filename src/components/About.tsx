const About = () => {
  return (
    <section id="about" className="py-32 px-4 md:px-8 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="animate-fade-in-up space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              About <span className="text-primary">Me</span>
            </h2>
            <div className="h-1 w-24 bg-primary"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                Passionate Developer Building the Future
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Currently focusing on <span className="text-primary font-semibold">Flutter</span> and <span className="text-primary font-semibold">Node.js</span>, 
                I build applications and backend services that make a difference.
              </p>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-foreground/70 leading-relaxed">
                My journey in software development spans mobile applications, full-stack web development, 
                and scalable backend services. I'm continuously expanding my expertise in Docker, ORMs, 
                and cloud platforms to deliver cutting-edge solutions.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-card border border-primary/20 rounded">
                  <span className="text-primary font-semibold">Mobile First</span>
                </div>
                <div className="px-4 py-2 bg-card border border-primary/20 rounded">
                  <span className="text-primary font-semibold">Full Stack</span>
                </div>
                <div className="px-4 py-2 bg-card border border-primary/20 rounded">
                  <span className="text-primary font-semibold">Cloud Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
