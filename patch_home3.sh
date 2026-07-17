sed -i '/<div className="grid grid-cols-3 gap-4 mb-4">/i \
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-4 relative overflow-hidden group">\
            <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-4">Macros Chart</h3>\
            <div className="h-40 w-full -ml-4">\
              <ResponsiveContainer width="100%" height="100%">\
                <BarChart data={macroChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>\
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />\
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} dy={10} />\
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />\
                  <Tooltip \
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}\
                    itemStyle={{ color: "#fff" }}\
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}\
                  />\
                  <Bar dataKey="Consumed" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />\
                  <Bar dataKey="Target" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} barSize={20} />\
                </BarChart>\
              </ResponsiveContainer>\
            </div>\
          </div>' src/pages/Home.tsx
