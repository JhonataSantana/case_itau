import React, { useState } from 'react';
import { CATEGORIES, ALL_BLOCKS } from './nodes/index';

export default function NodeCarousel() {
  const [activeTab, setActiveTab] = useState('fonte');

  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const blocks = ALL_BLOCKS.filter(b => b.category === activeTab);

  return (
    <div className="node-carousel">
      <div className="carousel-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`carousel-tab${activeTab === cat.key ? ' active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
          >
            <span className="carousel-tab-dot" style={{ background: cat.dot }} />
            {cat.label}
          </button>
        ))}
      </div>
      <div className="carousel-items">
        {blocks.map(block => {
          const { Icon } = block;
          return (
            <div
              key={block.type}
              className="carousel-node"
              draggable
              onDragStart={e => onDragStart(e, block.type)}
              title={`Arraste para o canvas: ${block.label}`}
            >
              <div className="carousel-node-icon" style={{ background: block.color }}>
                <Icon />
              </div>
              <span className="carousel-node-label">{block.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
