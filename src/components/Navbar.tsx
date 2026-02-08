const Navbar = ({ onHowItWorks }: { onHowItWorks: () => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between py-4">
        <span className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2">
          <span className="animate-icon-pulse">⚡</span> PREDICTOR AI
        </span>
        <button
          onClick={onHowItWorks}
          className="text-sm text-muted-foreground hover:text-accent transition-all duration-400"
        >
          How It Works
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
