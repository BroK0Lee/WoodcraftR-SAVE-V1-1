import React from "react";

export const CarouselHeader: React.FC = () => (
  <div className="mb-8 text-center">
    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 bg-clip-text text-transparent mb-4">
      Sélectionnez votre matière
    </h1>
    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
      Utilisez la molette pour naviguer
    </p>
  </div>
);

export default CarouselHeader;
