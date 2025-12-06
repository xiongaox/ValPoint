// @ts-nocheck
import React from 'react';
import Icon from './Icon';

const Lightbox = ({ viewingImage, setViewingImage }) => {
  if (!viewingImage) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setViewingImage(null)}>
      <img src={viewingImage} className="lightbox-img rounded" onClick={(e) => e.stopPropagation()} />
      <button
        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-[#ff4655] rounded-full text-white transition-all backdrop-blur-md border border-white/20"
        onClick={(e) => {
          e.stopPropagation();
          setViewingImage(null);
        }}
      >
        <Icon name="X" size={28} />
      </button>
    </div>
  );
};

export default Lightbox;
