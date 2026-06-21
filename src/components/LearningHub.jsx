import { useState } from 'react';
import { playBloop } from '../audio';

const ALL_CONTENT = [
  {
    category: 'Carbon Basics',
    type: 'video', 
    title: 'Understanding Carbon Offsets', 
    duration: '12 min', 
    img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80',
    url: 'https://youtu.be/Sl4wqQ04yec?si=SpKXQWrBRXk2Z3g8'
  },
  {
    category: 'Carbon Basics',
    type: 'article',
    title: 'What is a Carbon Footprint?',
    duration: '5 min read',
    img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80',
    url: '#'
  },
  {
    category: 'Global Warming',
    type: 'video',
    title: 'The Science of Climate Change',
    duration: '15 min',
    img: 'https://images.unsplash.com/photo-1615014605929-1ab0df6d12bf?w=400&q=80',
    url: '#'
  },
  {
    category: 'Global Warming',
    type: 'article',
    title: 'How 1.5 Degrees Changes Everything',
    duration: '10 min read',
    img: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=400&q=80',
    url: '#'
  },
  {
    category: 'Greenhouse Gases',
    type: 'article',
    title: 'Methane vs. CO2: What’s the Difference?',
    duration: '7 min read',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    url: '#'
  },
  {
    category: 'Renewable Energy',
    type: 'video',
    title: 'The Future of Solar Power',
    duration: '8 min',
    img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80',
    url: '#'
  },
  {
    category: 'Sustainable Lifestyle',
    type: 'video', 
    title: 'The Lifecycle of Plastic', 
    duration: '5 min', 
    img: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&q=80',
    url: 'https://www.youtube.com/watch?v=RS7IzU2VJIQ'
  },
  {
    category: 'Sustainable Lifestyle',
    type: 'article', 
    title: 'Composting 101 for Apartments', 
    duration: '8 min read', 
    img: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=400&q=80',
    url: 'https://www.epa.gov/recycle/composting-home'
  }
];

const CATEGORIES = ['All Topics', 'Carbon Basics', 'Global Warming', 'Greenhouse Gases', 'Renewable Energy', 'Sustainable Lifestyle'];

export default function LearningHub() {
  const [activeTab, setActiveTab] = useState('All Topics');

  const filteredContent = activeTab === 'All Topics' 
    ? ALL_CONTENT 
    : ALL_CONTENT.filter(item => item.category === activeTab);

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Learning Hub</h2>
      <p className="text-soil font-medium mb-8">Curated content to help you make greener choices.</p>
      
      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 custom-scrollbar no-scrollbar">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => { playBloop(); setActiveTab(category); }}
            className={`whitespace-nowrap px-4 py-2 rounded-full border-2 border-forest font-bold text-xs uppercase tracking-widest smooth-transition shadow-sm ${
              activeTab === category
                ? 'bg-forest text-cream'
                : 'bg-white text-forest hover:bg-leaf/20'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredContent.map((item, idx) => (
          <a 
            key={idx} 
            href={item.url === '#' ? '#article' : item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} — ${item.duration} (opens in new tab)`}
            onClick={playBloop}
            className="bg-white border-4 border-forest rounded-[2rem] overflow-hidden shadow-brutal flex flex-col group hover:-translate-y-2 hover:shadow-brutal-hover smooth-transition cursor-pointer relative no-underline block"
          >
            <div className="h-40 relative border-b-4 border-forest overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 smooth-transition duration-700" />
              {item.type === 'video' && (
                <div className="absolute inset-0 bg-forest/30 flex items-center justify-center group-hover:bg-forest/10 smooth-transition">
                  <div className="bg-white rounded-full p-2 border-2 border-forest shadow-brutal-sm group-hover:scale-110 smooth-transition">
                    <iconify-icon icon="ph:play-circle-fill" class="text-4xl text-leaf"></iconify-icon>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between bg-cream">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-cream bg-forest px-2 py-1 rounded-sm">
                    {item.type}
                  </span>
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-forest bg-leaf/20 px-2 py-1 rounded-sm border border-leaf/30">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest leading-tight mb-4 group-hover:text-leaf smooth-transition">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-soil font-bold text-xs uppercase tracking-wider">
                <iconify-icon icon={item.type === 'video' ? 'ph:clock-bold' : 'ph:book-open-bold'} class="text-lg"></iconify-icon>
                <span>{item.duration}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
