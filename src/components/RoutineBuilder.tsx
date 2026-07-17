import { X, Plus, Search, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { ALTERNATIVE_EXERCISES } from '../pages/Exercises';

interface RoutineBuilderProps {
  onClose: () => void;
  onSave: (routine: any) => void;
  allExercises: any[];
}

export default function RoutineBuilder({ onClose, onSave, allExercises }: RoutineBuilderProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [todayExercises, setTodayExercises] = useState<any[]>([]);
  const [tomorrowExercises, setTomorrowExercises] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = allExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleExercise = (ex: any) => {
    if (activeTab === 'today') {
      if (todayExercises.some(e => e.id === ex.id)) {
        setTodayExercises(todayExercises.filter(e => e.id !== ex.id));
      } else {
        setTodayExercises([...todayExercises, ex]);
      }
    } else {
      if (tomorrowExercises.some(e => e.id === ex.id)) {
        setTomorrowExercises(tomorrowExercises.filter(e => e.id !== ex.id));
      } else {
        setTomorrowExercises([...tomorrowExercises, ex]);
      }
    }
  };

  const handleSave = () => {
    onSave({
      todayTitle: 'Custom Workout',
      todaySubtitle: 'Your tailored routine',
      tomorrowTitle: 'Custom Workout',
      tomorrowSubtitle: 'Your tailored routine',
      today: todayExercises,
      tomorrow: tomorrowExercises
    });
  };

  const isSelected = (ex: any) => {
    return activeTab === 'today' 
      ? todayExercises.some(e => e.id === ex.id)
      : tomorrowExercises.some(e => e.id === ex.id);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0F172A] flex flex-col overflow-hidden">
      <header className="flex justify-between items-center p-6 bg-black/30 backdrop-blur-md relative z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-light tracking-widest text-white uppercase">Build Routine</h2>
        <button 
          onClick={handleSave}
          disabled={todayExercises.length === 0 && tomorrowExercises.length === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors"
        >
          Save
        </button>
      </header>

      <div className="flex justify-center my-6">
        <div className="bg-white/5 p-1 rounded-full border border-white/10 flex">
          <button 
            className={`px-6 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setActiveTab('today')}
          >
            Today ({todayExercises.length})
          </button>
          <button 
            className={`px-6 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${activeTab === 'tomorrow' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setActiveTab('tomorrow')}
          >
            Tomorrow ({tomorrowExercises.length})
          </button>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text" 
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3 custom-scrollbar">
        {filteredExercises.map(ex => {
          const selected = isSelected(ex);
          return (
            <div 
              key={ex.id} 
              onClick={() => handleToggleExercise(ex)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${
                selected 
                  ? 'bg-indigo-500/20 border-indigo-500/50' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <img src={ex.imgUrl} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-light tracking-widest text-white mb-1">{ex.name}</h3>
                <p className="text-[10px] font-mono text-white/50">{ex.sets}</p>
              </div>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                selected
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-400'
                  : 'border-white/10 text-white/30 group-hover:text-indigo-400 group-hover:border-indigo-500/50'
              }`}>
                {selected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
