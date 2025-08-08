import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Play, Pause, X, MapPin, Calendar, Star } from 'lucide-react';

interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  color: string;
  fullDescription: string;
  location: string;
  date: string;
  rating: number;
  tags: string[];
}

const carouselData: CarouselItem[] = [
  {
    id: 1,
    title: "Ocean Waves",
    description: "Discover the mesmerizing beauty of ocean waves crashing against pristine shores",
    image: "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#0EA5E9",
    fullDescription: "Immerse yourself in the rhythmic dance of ocean waves as they crash against pristine shores. This breathtaking scene captures the raw power and serene beauty of nature's most mesmerizing spectacle. The endless blue horizon meets crystalline waters, creating a symphony of sound and motion that soothes the soul and awakens the spirit of adventure.",
    location: "Maldives",
    date: "2024",
    rating: 4.9,
    tags: ["Ocean", "Waves", "Nature", "Peaceful"]
  },
  {
    id: 2,
    title: "Mountain Peak",
    description: "Experience the majestic view from the world's highest mountain peaks",
    image: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#10B981",
    fullDescription: "Stand atop the world's most magnificent mountain peaks and witness views that few have ever experienced. The crisp mountain air fills your lungs as you gaze upon endless ranges stretching to the horizon. Snow-capped summits pierce through clouds, creating a landscape so dramatic and beautiful it takes your breath away.",
    location: "Swiss Alps",
    date: "2024",
    rating: 4.8,
    tags: ["Mountains", "Adventure", "Snow", "Hiking"]
  },
  {
    id: 3,
    title: "Desert Sunset",
    description: "Witness the breathtaking colors of sunset over endless desert dunes",
    image: "https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#F59E0B",
    fullDescription: "Experience the magic of a desert sunset as golden hour transforms endless sand dunes into a canvas of warm, glowing colors. The sky erupts in brilliant oranges, deep purples, and soft pinks, while the desert landscape shifts from harsh daylight to a serene, mystical wonderland that speaks to the soul.",
    location: "Sahara Desert",
    date: "2024",
    rating: 4.7,
    tags: ["Desert", "Sunset", "Golden Hour", "Serene"]
  },
  {
    id: 4,
    title: "Forest Path",
    description: "Walk through enchanted forest paths where nature tells its ancient stories",
    image: "https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#059669",
    fullDescription: "Journey through ancient forest paths where towering trees create natural cathedrals of green. Sunlight filters through the canopy, casting dancing shadows on moss-covered ground. Every step reveals new wonders - from delicate wildflowers to the gentle sounds of woodland creatures living in perfect harmony with their environment.",
    location: "Black Forest, Germany",
    date: "2024",
    rating: 4.6,
    tags: ["Forest", "Nature", "Peaceful", "Wildlife"]
  },
  {
    id: 5,
    title: "City Lights",
    description: "Marvel at the electric energy of city lights illuminating the night sky",
    image: "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#8B5CF6",
    fullDescription: "Feel the pulse of urban life as millions of lights create a dazzling tapestry across the night sky. From towering skyscrapers to bustling streets below, the city comes alive after dark with an energy that's both exhilarating and inspiring. This is where dreams are made and stories unfold under the glow of neon and starlight.",
    location: "Tokyo, Japan",
    date: "2024",
    rating: 4.8,
    tags: ["City", "Lights", "Urban", "Night"]
  },
  {
    id: 6,
    title: "Aurora Borealis",
    description: "Experience the mystical dance of northern lights across the arctic sky",
    image: "https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800",
    color: "#EC4899",
    fullDescription: "Witness one of nature's most spectacular phenomena as the Aurora Borealis paints the arctic sky in ethereal greens, blues, and purples. This celestial dance occurs when solar particles collide with Earth's atmosphere, creating a light show so magnificent it has inspired legends and wonder for thousands of years.",
    location: "Iceland",
    date: "2024",
    rating: 5.0,
    tags: ["Aurora", "Northern Lights", "Arctic", "Magical"]
  }
];

const Carousel3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CarouselItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const radius = 300;
  const totalItems = carouselData.length;
  const angleStep = 360 / totalItems;

  const openCard = (item: CarouselItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCard(item);
    setIsModalOpen(true);
    setIsAutoPlay(false);
    
    // Animate modal opening
    if (modalRef.current && modalContentRef.current) {
      gsap.set(modalRef.current, { display: 'flex', opacity: 0 });
      gsap.set(modalContentRef.current, { 
        scale: 0.8, 
        rotationY: -15,
        opacity: 0,
        y: 50
      });
      
      const tl = gsap.timeline();
      tl.to(modalRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(modalContentRef.current, {
        scale: 1,
        rotationY: 0,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.1");
    }
  };

  // Handle wheel scroll
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isModalOpen || isScrolling) return;
      
      event.preventDefault();
      setIsScrolling(true);
      
      const delta = event.deltaY;
      
      if (delta > 0) {
        // Scroll down - next slide
        setCurrentIndex((prev) => (prev + 1) % totalItems);
      } else {
        // Scroll up - previous slide
        setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
      
      // Debounce scrolling
      setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isModalOpen, isScrolling, totalItems]);

  const closeCard = () => {
    if (modalRef.current && modalContentRef.current) {
      const tl = gsap.timeline();
      tl.to(modalContentRef.current, {
        scale: 0.8,
        rotationY: 15,
        opacity: 0,
        y: -50,
        duration: 0.4,
        ease: "power2.in"
      })
      .to(modalRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setIsModalOpen(false);
          setSelectedCard(null);
          gsap.set(modalRef.current, { display: 'none' });
        }
      }, "-=0.1");
    }
  };
  useEffect(() => {
    if (!carouselRef.current) return;

    // Initialize carousel positions
    itemsRef.current.forEach((item, index) => {
      if (!item) return;
      
      const angle = angleStep * index;
      const x = Math.sin((angle * Math.PI) / 180) * radius;
      const z = Math.cos((angle * Math.PI) / 180) * radius;
      
      gsap.set(item, {
        rotationY: angle,
        transformOrigin: "center center",
        x: x,
        z: z,
      });
    });

    // Set initial rotation
    gsap.set(carouselRef.current, {
      transformStyle: "preserve-3d",
      rotationY: -currentIndex * angleStep,
    });
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;

    // Animate to current position
    gsap.to(carouselRef.current, {
      rotationY: -currentIndex * angleStep,
      duration: 1,
      ease: "power2.inOut",
    });

    // Animate items based on their position relative to current
    itemsRef.current.forEach((item, index) => {
      if (!item) return;
      
      const distance = Math.abs(index - currentIndex);
      const minDistance = Math.min(distance, totalItems - distance);
      
      gsap.to(item, {
        scale: index === currentIndex ? 1 : 0.8 - (minDistance * 0.1),
        opacity: index === currentIndex ? 1 : 0.6 - (minDistance * 0.15),
        duration: 1,
        ease: "power2.inOut",
      });
    });
  }, [currentIndex, angleStep, totalItems]);

  useEffect(() => {
    if (!isAutoPlay || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlay, isHovered, totalItems]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const addToRefs = (el: HTMLDivElement | null, index: number) => {
    if (el && !itemsRef.current[index]) {
      itemsRef.current[index] = el;
    }
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Elements (scoped to panel, no pointer events) */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent rounded-full" />
      </div>

      {/* Main Container */}
      <div 
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            3D Carousel
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Découvrez une expérience immersive avec notre carousel 3D interactif
          </p>
        </div>

        {/* Carousel Container */}
    <div className="relative w-full max-w-6xl h-96 md:h-[500px]">
          <div 
      className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            <div
              ref={carouselRef}
              className="relative w-80 h-80 md:w-96 md:h-96"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {carouselData.map((item, index) => (
                <div
                  key={item.id}
                  ref={(el) => addToRefs(el, index)}
                  className="absolute inset-0 cursor-pointer group"
                  onClick={(e) => {
                    if (index === currentIndex) {
                      openCard(item, e);
                    } else {
                      goToSlide(index);
                    }
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                    {/* Image */}
                    <div className="absolute inset-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                        style={{ backgroundColor: `${item.color}20` }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-gray-200 text-sm md:text-base leading-relaxed opacity-90">
                        {item.description}
                      </p>
                      {index === currentIndex && (
                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                            Cliquez pour ouvrir
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Reflection Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-8 mt-8">
          {/* Auto-play Toggle */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-3 rounded-full backdrop-blur-sm border transition-all duration-300 hover:scale-110 hover:shadow-lg ${
              isAutoPlay 
                ? 'bg-green-500/20 border-green-400/50 text-green-300' 
                : 'bg-red-500/20 border-red-400/50 text-red-300'
            }`}
          >
            {isAutoPlay ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
        </div>

        {/* Indicators */}
        <div className="flex space-x-3 mt-6">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                index === currentIndex
                  ? 'bg-white shadow-lg shadow-white/50'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Current Slide Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: carouselData[currentIndex].color }}
            />
            <span className="text-white font-medium">
              {currentIndex + 1} / {totalItems}
            </span>
            <span className="text-gray-300 text-sm">
              {carouselData[currentIndex].title}
            </span>
            <span className="text-gray-400 text-xs hidden sm:inline">
              Utilisez la molette pour naviguer
            </span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedCard && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeCard}
        >
          <div
            ref={modalContentRef}
            className="relative max-w-4xl w-full max-h-[90vh] bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Close Button */}
            <button
              onClick={closeCard}
              className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row h-full">
              {/* Image Section */}
              <div className="relative lg:w-1/2 h-64 lg:h-auto">
                <img
                  src={selectedCard.image}
                  alt={selectedCard.title}
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"
                  style={{ backgroundColor: `${selectedCard.color}20` }}
                />
                
                {/* Rating Badge */}
                <div className="absolute top-6 left-6 flex items-center space-x-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-medium">{selectedCard.rating}</span>
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    {selectedCard.title}
                  </h2>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedCard.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedCard.date}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-200 text-lg leading-relaxed mb-8">
                  {selectedCard.fullDescription}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedCard.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  className="self-start px-8 py-3 rounded-full font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: selectedCard.color,
                    boxShadow: `0 10px 30px ${selectedCard.color}40`
                  }}
                  onClick={() => {
                    // Action personnalisée ici
                    console.log('Explore clicked for:', selectedCard.title);
                  }}
                >
                  Explorer maintenant
                </button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-3xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Carousel3D;