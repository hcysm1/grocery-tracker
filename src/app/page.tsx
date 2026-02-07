
import GroceryTracker from "./GroceryTracker"; 
import { getReceipts } from "@/lib/data"; // We will create this fetcher next

export default async function Page() {
  // 1. Fetch data from Supabase on the server
  const data = await getReceipts();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 2. Pass data to your UI. The 'key' forces a refresh after upload */}
      <GroceryTracker receipts={data} key={data.length} />
    </div>
  );
}