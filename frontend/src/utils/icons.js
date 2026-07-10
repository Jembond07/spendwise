const CATEGORY_ICONS = {
  "shopping-cart": "🛒",
  utensils: "🍽️",
  car: "🚗",
  film: "🎬",
  bolt: "⚡",
  home: "🏠",
  bag: "🛍️",
  heart: "❤️",
  plane: "✈️",
  tag: "🏷️",
};

export const getCategoryIcon = (slug) => CATEGORY_ICONS[slug] || "🏷️";
