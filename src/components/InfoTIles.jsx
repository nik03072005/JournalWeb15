import { Monitor, PenTool, HardDrive, Globe } from 'lucide-react';

const tiles = [
  {
    title: "E-Book Access",
    description: "Explore thousands of textbooks and references spanning diverse academic disciplines.",
    icon: Monitor,
  },
  {
    title: "Research Journals",
    description: "Access top-tier commercial databases for industry across your disciplines.",
    icon: PenTool,
  },
  {
    title: "Digital Archives",
    description: "Discover rare manuscripts, old books papers, and milestone collection items.",
    icon: HardDrive,
  },
  {
    title: "Online Resources",
    description: "Use databases, website and search sources to layout course preparations.",
    icon: Globe,
  },
];

export default function InfoTiles() {
  return (
    <section className="py-20 px-6 md:px-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Explore Our Collections
        </h2>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Discover vast resources across multiple disciplines with cutting-edge search and discovery tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Colored Top Section with Icon */}
              <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 p-8 flex justify-center">
                <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-xl">
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 text-center">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-3">{tile.title}</h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-sm">
                  {tile.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}