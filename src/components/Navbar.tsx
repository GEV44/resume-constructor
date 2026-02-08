const Navbar = ({ onHowItWorks }: { onHowItWorks: () => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between py-4">
        <span className="font-heading font-bold text-xl gradient-text">⚡ PREDICTOR AI</span>
        <button
          onClick={onHowItWorks}
          className="text-sm text-muted-foreground hover:text-accent transition-colors duration-300"
        >
          How It Works
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
