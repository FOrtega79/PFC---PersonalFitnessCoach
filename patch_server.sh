sed -i 's/model: '\''gemini-3.5-flash'\''/model: '\''gemini-2.5-flash'\''/g' server.ts

sed -i 's/res.status(500).json({ error: "Failed to estimate calories" });/res.status(503).json({ error: "The AI Coach is currently taking a break. Please try again in a few moments." });/g' server.ts

sed -i 's/res.status(500).json({ error: "Failed to define goal" });/res.status(503).json({ error: "The AI Coach is currently taking a break. Please try again in a few moments." });/g' server.ts

sed -i 's/res.status(500).json({ error: "Failed to generate tip" });/res.json({ tip: "Stay consistent and trust the process. Every small step counts towards your goal!" });/g' server.ts
