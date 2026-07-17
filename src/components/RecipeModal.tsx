import { X, Flame, ChefHat, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type MealId = 'breakfast' | 'lunch' | 'dinner' | null;

interface Recipe {
  id: string;
  title: string;
  calories: number;
  macros: { p: number; c: number; f: number };
  ingredients: string[];
  instructions: string[];
}

export const RECIPES: Record<'today' | 'tomorrow', Record<string, Recipe>> = {
  today: {
    breakfast: {
      id: 'breakfast',
      title: 'Oatmeal & Eggs',
      calories: 450,
      macros: { p: 25, c: 45, f: 18 },
      ingredients: [
        '45g rolled oats',
        '240ml almond milk or water',
        '5ml honey or maple syrup',
        '2 whole eggs',
        'Salt and pepper to taste',
        'Optional: 40g berries'
      ],
      instructions: [
        'Combine oats and liquid in a pot or microwave-safe bowl.',
        'Cook until liquid is absorbed (about 2-3 mins in microwave or 5 mins on stove).',
        'Stir in honey and berries.',
        'In a separate pan, cook eggs to your preference (scrambled, fried, or boiled).',
        'Serve together for a balanced start to your day.'
      ]
    },
    lunch: {
      id: 'lunch',
      title: 'Chicken Salad',
      calories: 550,
      macros: { p: 45, c: 15, f: 35 },
      ingredients: [
        '170g cooked chicken breast, diced',
        '90g mixed greens',
        '75g cherry tomatoes, halved',
        '1/4 red onion, thinly sliced',
        '1/4 avocado, diced',
        '30ml olive oil vinaigrette'
      ],
      instructions: [
        'Place mixed greens in a large bowl.',
        'Top with diced chicken breast, tomatoes, red onion, and avocado.',
        'Drizzle with olive oil vinaigrette.',
        'Toss gently to combine all ingredients.',
        'Enjoy your high-protein, nutrient-dense lunch.'
      ]
    },
    dinner: {
      id: 'dinner',
      title: 'Salmon & Rice',
      calories: 600,
      macros: { p: 40, c: 55, f: 22 },
      ingredients: [
        '170g salmon fillet',
        '90g jasmine or brown rice (dry)',
        '150g asparagus or broccoli',
        '15ml olive oil',
        'Lemon juice, salt, and pepper'
      ],
      instructions: [
        'Preheat oven to 200°C.',
        'Cook rice according to package instructions.',
        'Place salmon and asparagus on a baking sheet. Drizzle with olive oil, salt, and pepper.',
        'Bake for 12-15 minutes until salmon flakes easily.',
        'Serve salmon and veggies over the cooked rice. Squeeze fresh lemon over the top.'
      ]
    }
  },
  tomorrow: {
    breakfast: {
      id: 'breakfast',
      title: 'Protein Pancakes',
      calories: 400,
      macros: { p: 35, c: 40, f: 12 },
      ingredients: [
        '60g protein pancake mix',
        '80ml almond milk or water',
        '1 whole egg',
        '1/2 banana, sliced',
        '15ml sugar-free syrup'
      ],
      instructions: [
        'Whisk pancake mix, liquid, and egg until smooth.',
        'Heat a non-stick pan over medium heat.',
        'Pour batter to form pancakes and cook until bubbles appear (2-3 mins).',
        'Flip and cook for another minute.',
        'Top with sliced banana and syrup.'
      ]
    },
    lunch: {
      id: 'lunch',
      title: 'Turkey Wrap',
      calories: 500,
      macros: { p: 40, c: 45, f: 15 },
      ingredients: [
        '1 whole wheat tortilla',
        '115g sliced turkey breast',
        '1 slice provolone cheese',
        '15g spinach',
        '2 slices tomato',
        '15ml light mayo or mustard'
      ],
      instructions: [
        'Lay the tortilla flat.',
        'Spread mayo or mustard evenly.',
        'Layer spinach, tomato, turkey, and cheese.',
        'Fold in the sides and roll tightly.',
        'Optional: Toast in a pan for 2 mins per side.'
      ]
    },
    dinner: {
      id: 'dinner',
      title: 'Lean Beef Stir-Fry',
      calories: 650,
      macros: { p: 45, c: 60, f: 20 },
      ingredients: [
        '170g lean ground beef (5% fat)',
        '150g mixed stir-fry vegetables (broccoli, bell peppers, carrots)',
        '90g jasmine rice (dry)',
        '30ml low-sodium soy sauce',
        '5ml sesame oil',
        '2g ginger & garlic powder'
      ],
      instructions: [
        'Cook rice according to package instructions.',
        'In a pan, brown the ground beef over medium-high heat until fully cooked. Drain excess fat.',
        'Add vegetables, soy sauce, sesame oil, and spices.',
        'Stir-fry for 5-7 minutes until vegetables are tender.',
        'Serve the beef and vegetables over the cooked rice.'
      ]
    }
  }
};

interface RecipeModalProps {
  mealId: MealId;
  isTomorrow?: boolean;
  targetCals?: number;
  onClose: () => void;
}

export default function RecipeModal({ mealId, isTomorrow, targetCals, onClose }: RecipeModalProps) {
  if (!mealId) return null;

  const recipe = RECIPES[isTomorrow ? 'tomorrow' : 'today'][mealId];
  if (!recipe) return null;

  let displayCalories = recipe.calories;
  let displayMacros = { ...recipe.macros };

  if (targetCals) {
    const mealPercentages = {
      breakfast: 0.30,
      lunch: 0.35,
      dinner: 0.35,
    };
    const pct = mealPercentages[mealId];
    displayCalories = Math.round(targetCals * pct);
    
    displayMacros.p = Math.round((displayCalories * 0.3) / 4);
    displayMacros.c = Math.round((displayCalories * 0.4) / 4);
    displayMacros.f = Math.round((displayCalories * 0.3) / 9);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#0F172A] border border-white/10 rounded-3xl relative shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ChefHat className="w-4 h-4 text-fuchsia-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">
                  {mealId}
                </span>
              </div>
              <h2 className="text-2xl font-light tracking-wider text-white">
                {recipe.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-8">
            {/* Macros */}
            {targetCals && (
              <div className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mb-[-1.5rem] bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20 text-center">
                Portions adjusted for your goals
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-1">Cals</p>
                <p className="font-light tracking-wider text-white">{displayCalories}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-1">Pro</p>
                <p className="font-light tracking-wider text-indigo-300">{displayMacros.p}g</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-1">Carb</p>
                <p className="font-light tracking-wider text-fuchsia-300">{displayMacros.c}g</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase mb-1">Fat</p>
                <p className="font-light tracking-wider text-blue-300">{displayMacros.f}g</p>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                <Flame className="w-3 h-3" />
                Ingredients
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/50 mt-1.5 flex-shrink-0" />
                    <span className="text-sm font-mono text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Instructions
              </h3>
              <div className="space-y-4">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-[10px] font-mono text-white/50">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-light leading-relaxed text-white/80 mt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="mt-4 w-full py-4 bg-white/10 text-white rounded-2xl font-mono text-xs tracking-widest uppercase hover:bg-white/20 transition-colors border border-white/10"
            >
              Close Recipe
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
