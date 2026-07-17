sed -i '/const totalConsumedCals = /a \
  const macroChartData = [\
    { name: "Protein", Consumed: Math.round(((totalConsumedCals)*0.3/4)), Target: protein },\
    { name: "Carbs", Consumed: Math.round(((totalConsumedCals)*0.4/4)), Target: carbs },\
    { name: "Fats", Consumed: Math.round(((totalConsumedCals)*0.3/9)), Target: fats }\
  ];' src/pages/Home.tsx
