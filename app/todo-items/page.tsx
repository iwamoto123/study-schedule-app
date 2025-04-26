"use client";
import { useEffect, useState } from "react";
import {
  createTodoItem,
  fetchTodoItems,
  updateTodoItem,
  deleteTodoItem,
  TodoItem,
} from "@/app/scripts/TodoItem";
import InputSingle from "@/components/InputSingle";
import RadioGroup from "@/components/RadioGroup";

// 型エイリアスを再掲（TodoItem と合わせる）
export type UnitType = "pages" | "problems";

const unitOptions = [
  { label: "ページ", value: "pages" },
  { label: "問題", value: "problems" },
];

/**
 * TodoItems CRUD 画面
 * - 今日の日付キー配下 (users/{uid}/todos/{todayKey}/items) を操作
 */
export default function TodoItemsPage() {
  const uid = "demoUser"; // TODO: 実装時はログインユーザー UID を使用
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  /* ------------------------------ state ------------------------------ */
  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // フォーム用
  const [title, setTitle] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("pages");
  const [planCount, setPlanCount] = useState(0);

  /* ------------------------------ CRUD ------------------------------ */
  const loadItems = async () => {
    setLoading(true);
    const data = await fetchTodoItems(uid, todayKey);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Create */
  const handleAdd = async () => {
    if (!title.trim() || planCount <= 0) return;
    const id = crypto.randomUUID(); // uuid 生成
    const item: TodoItem = { id, title, unitType, planCount, done: 0 };
    await createTodoItem(uid, todayKey, item);
    // フォームクリア & 再読込
    setTitle("");
    setPlanCount(0);
    await loadItems();
  };

  /** Update 任意フィールド */
  const handleUpdate = async (
    id: string,
    updates: Partial<Omit<TodoItem, "id">>
  ) => {
    await updateTodoItem(uid, todayKey, id, updates);
    await loadItems();
  };

  /** Delete */
  const handleDelete = async (id: string) => {
    if (!confirm("削除してよろしいですか？")) return;
    await deleteTodoItem(uid, todayKey, id);
    await loadItems();
  };

  /* ------------------------------ view ------------------------------ */
  return (
    <main className="mx-auto max-w-lg p-6 space-y-10">
      <h1 className="text-2xl font-bold">TodoItems CRUD Demo</h1>

      {/* ---------- Create ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">新規追加</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            className="rounded-md border px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-4">
            <InputSingle value={planCount} onChange={setPlanCount} />
            <RadioGroup
              options={unitOptions}
              value={unitType}
              onChange={(unitTypeValue: string) => {
                setUnitType(unitTypeValue as UnitType)
              }}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim() || planCount <= 0}
            className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </section>

      {/* ---------- Read / Update / Delete ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">一覧</h2>

        {loading && <p>Loading...</p>}
        {items.length === 0 && !loading && (
          <p className="text-sm text-gray-500">データがありません</p>
        )}

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 px-4 py-3"
            >
              {/* タイトル */}
              <input
                type="text"
                value={item.title}
                onChange={(e) =>
                  handleUpdate(item.id, { title: e.target.value })
                }
                className="flex-1 min-w-0 text-sm font-medium"
              />

              {/* planCount */}
              <InputSingle
                value={item.planCount}
                onChange={(n) => handleUpdate(item.id, { planCount: n })}
                className="text-center"
              />

              {/* unitType */}
              <select
                value={item.unitType}
                onChange={(e) =>
                  handleUpdate(item.id, {
                    unitType: e.target.value as UnitType,
                  })
                }
                className="rounded-md border px-1 py-0.5 text-sm"
              >
                <option value="pages">ページ</option>
                <option value="problems">問題</option>
              </select>

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-md bg-red-500 px-2 py-1 text-xs text-white"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
