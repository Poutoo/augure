import { redirect } from 'next/navigation';

// Ce chemin est obsolète — les détails de trends passent désormais par ?trendId=UUID dans le modal
export default async function TrendDetailPage() {
  redirect('/');
}
