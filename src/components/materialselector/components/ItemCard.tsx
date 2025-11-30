import React from "react";
import type { CarouselItem } from "../types";

export type ItemCardProps = {
  item: CarouselItem;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  addRef: (el: HTMLDivElement | null) => void;
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isActive,
  onClick,
  addRef,
}) => (
  <div
    ref={addRef}
    className="absolute inset-0 cursor-pointer group"
    onClick={onClick}
    style={{ transformStyle: "preserve-3d" }}
  >
    <div className="relative w-full h-full bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
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
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-gray-200 text-sm md:text-base leading-relaxed opacity-90">
          {item.description}
        </p>
        {isActive && (
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
              Plus de détails
            </span>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  </div>
);

export default ItemCard;
