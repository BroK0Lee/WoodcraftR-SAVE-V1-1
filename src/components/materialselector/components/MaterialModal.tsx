import React from "react";
import { X, MapPin, Calendar, Star } from "lucide-react";
import type { CarouselItem } from "../types";

export type MaterialModalProps = {
  isOpen: boolean;
  selected: CarouselItem | null;
  onClose: () => void;
  onChoose: () => void;
  modalRef: React.RefObject<HTMLDivElement>;
  modalContentRef: React.RefObject<HTMLDivElement>;
};

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  selected,
  onClose,
  onChoose,
  modalRef,
  modalContentRef,
}) => {
  if (!isOpen || !selected) return null;
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
        className="relative max-w-4xl w-full max-h-[90vh] bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ transformStyle: "preserve-3d" }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col lg:flex-row h-full">
          <div className="relative lg:w-1/2 h-64 lg:h-auto">
            <img
              src={selected.image}
              alt={selected.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"
              style={{ backgroundColor: `${selected.color}20` }}
            />
            <div className="absolute top-6 left-6 flex items-center space-x-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white font-medium">{selected.rating}</span>
            </div>
          </div>
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {selected.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selected.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{selected.date}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-200 text-lg leading-relaxed mb-8">
              {selected.fullDescription}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {selected.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="self-start px-8 py-3 rounded-full font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: selected.color,
                boxShadow: `0 10px 30px ${selected.color}40`,
              }}
              onClick={onChoose}
            >
              Choisir cette matière
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-3xl" />
      </div>
    </div>
  );
};

export default MaterialModal;
