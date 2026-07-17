import React, { useMemo } from 'react';
import { X, ShoppingCart, Check } from 'lucide-react';
import { RECIPES } from './RecipeModal';

export default function GroceryListModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const groceryList = useMemo(() => {
    const list = new Map<string, string>();
    
    const parseIngredient = (ingredient: string) => {
      const match = ingredient.match(/^([\d/.\-~]+[a-zA-Z]*)\s+(.*)$/);
      if (match) {
        return { qty: match[1], name: match[2].replace(/Optional:\s*/i, '') };
      }
      return { qty: '', name: ingredient.replace(/Optional:\s*/i, '') };
    };

    const addToList = (ingredient: string) => {
      const { qty, name } = parseIngredient(ingredient);
      const key = name.toLowerCase();
      if (list.has(key)) {
        if (qty && list.get(key) && !list.get(key)?.includes(qty)) {
           list.set(key, list.get(key) + ' + ' + qty);
        }
      } else {
        list.set(key, qty);
      }
    };

    Object.values(RECIPES.today).forEach(recipe => {
      recipe.ingredients.forEach(addToList);
    });
    Object.values(RECIPES.tomorrow).forEach(recipe => {
      recipe.ingredients.forEach(addToList);
    });

    return Array.from(list.entries()).map(([name, qty]) => ({ name, qty }));
  }, []);

  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set());

  const toggleItem = (name: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setCheckedItems(newSet);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#1e1b4b] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] mt-auto sm:mt-0 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 rounded-t-3xl border border-indigo-500/20">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-light tracking-widest uppercase text-white">Grocery List</h2>
              <p className="text-white/50 font-mono text-[10px] tracking-widest uppercase">Weekly Estimate</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-gradient-to-b from-transparent to-black/20">
           <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mb-6">
             <p className="text-xs font-mono text-indigo-300 uppercase tracking-wider leading-relaxed">
               This list is compiled from your current meal plan. Quantities shown are estimated based on your daily targets.
             </p>
           </div>

           <div className="space-y-2">
             {groceryList.map((item, idx) => {
               const isChecked = checkedItems.has(item.name);
               return (
                 <div 
                   key={idx}
                   onClick={() => toggleItem(item.name)}
                   className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-white/5 border-white/5 opacity-50' : 'bg-black/20 border-white/10 hover:border-indigo-500/30'}`}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20 text-transparent'}`}>
                       <Check className="w-4 h-4" />
                     </div>
                     <span className={`font-light capitalize tracking-wide ${isChecked ? 'text-white/50 line-through' : 'text-white/90'}`}>
                       {item.name}
                     </span>
                   </div>
                   {item.qty && (
                     <span className="font-mono text-xs text-indigo-300/70 text-right max-w-[40%] break-words">{item.qty}</span>
                   )}
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  )
}
