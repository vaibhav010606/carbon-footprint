export default function Game() {
  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Eco Quest: Save the Planet</h2>
      <p className="text-soil font-medium mb-8">Play as the Eco-Hero to restore nature!</p>

      <div className="bg-cream border-4 border-forest shadow-brutal rounded-[2rem] text-center relative overflow-hidden" style={{ height: '75vh', minHeight: '600px' }}>
        <iframe 
          src="/eco-quest.html" 
          title="Eco Quest Game" 
          className="absolute inset-0 w-full h-full border-0"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
