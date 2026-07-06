"use client";

import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
};

type CategoryFilterProps = {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function CategoryFilter({ categories, selectedCategoryId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          selectedCategoryId === null
            ? "border-navy bg-navy text-white"
            : "border-navy/20 bg-white text-navy hover:bg-cream",
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            selectedCategoryId === category.id
              ? "border-navy bg-navy text-white"
              : "border-navy/20 bg-white text-navy hover:bg-cream",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
