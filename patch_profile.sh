sed -i '/{\/\* Weight Logging \*\/}/i \
        {/* Adjust Goals Section */}\
        <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">\
          <div className="flex-1">\
            <h3 className="text-lg font-light tracking-widest uppercase text-white/90 mb-1">Adjust Your Goals</h3>\
            <p className="text-xs font-mono tracking-widest text-white/50 uppercase">Tweak targets, lifestyle, or retake the onboarding quiz.</p>\
          </div>\
          <button \
            onClick={() => setShowGoals(true)}\
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs tracking-widest uppercase transition-colors shadow-lg flex items-center justify-center gap-2"\
          >\
            <Settings className="w-4 h-4" /> Open Settings\
          </button>\
        </div>\
' src/pages/Profile.tsx
