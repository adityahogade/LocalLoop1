import { useState } from 'react';

export default function Tabs({ items = [], initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label="Tabs">
        {items.map((item, index) => (
          <button
            key={item.value || item.label}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={`tab ${index === activeIndex ? 'tab--active' : ''}`.trim()}
            onClick={() => setActiveIndex(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items[activeIndex]?.content ? <div className="tab__content">{items[activeIndex].content}</div> : null}
    </div>
  );
}
