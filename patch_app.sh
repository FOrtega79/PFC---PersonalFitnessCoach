sed -i 's/import { useWorkoutReminder } from '\''\.\/hooks\/useWorkoutReminder'\'';/import { useWorkoutReminder } from '\''\.\/hooks\/useWorkoutReminder'\'';\nimport { PaywallProvider } from '\''\.\/components\/PaywallProvider'\'';/g' src/App.tsx

sed -i 's/<BrowserRouter>/<PaywallProvider>\n      <BrowserRouter>/g' src/App.tsx

sed -i 's/<\/BrowserRouter>/<\/BrowserRouter>\n    <\/PaywallProvider>/g' src/App.tsx
