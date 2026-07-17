sed -i 's/onSubscribe: () => void;/onSubscribe: (tier: '\''monthly'\'' | '\''yearly'\'') => void;\n  onRestore: () => void;\n  isPurchasing?: boolean;/g' src/components/Paywall.tsx
sed -i 's/export default function Paywall({ onClose, onSubscribe }: PaywallProps) {/export default function Paywall({ onClose, onSubscribe, onRestore, isPurchasing }: PaywallProps) {/g' src/components/Paywall.tsx
sed -i 's/onClick={onSubscribe}/onClick={() => onSubscribe(selectedTier)}\n            disabled={isPurchasing}/g' src/components/Paywall.tsx
sed -i 's/Subscribe with Apple/{isPurchasing ? '\''Processing...'\'' : '\''Subscribe with Apple'\''}/g' src/components/Paywall.tsx
sed -i 's/<button onClick={() => {}} className="hover:text-white transition-colors">Restore Purchases<\/button>/<button onClick={onRestore} className="hover:text-white transition-colors">Restore Purchases<\/button>/g' src/components/Paywall.tsx
