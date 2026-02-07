import GroceryTracker from "./GroceryTracker";
import { getReceipts } from "@/lib/data";

export default async function Page() {
  const history = await getReceipts();

  return (
    <div className="min-h-screen bg-slate-50">
      <GroceryTracker receipts={history} key={history.length} />
    </div>
  );
}