"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi2";

// فئات الألوان
const categoryColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-yellow-100 text-yellow-700",
];

export default function CategoriesPage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<Record<string, number>>({});

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // get merchant id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    // load categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .eq("merchant_id", profile.id)
      .order("created_at", { ascending: false });

    setCategories(cats || []);

    // count products per category
    const counts: Record<string, number> = {};

    const { data: prods } = await supabase
      .from("products")
      .select("id, category_id");

    prods?.forEach((p) => {
      if (p.category_id) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
    });

    setProductsCount(counts);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setModalOpen(true);
  }

  function openEdit(cat: any) {
    setEditing(cat);
    setName(cat.name);
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      setSaving(false);
      return;
    }

    if (editing) {
      // update
      await supabase
        .from("categories")
        .update({ name })
        .eq("id", editing.id);

    } else {
      // create
      await supabase
        .from("categories")
        .insert({
          name,
          merchant_id: profile.id,
        });
    }

    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function remove(cat: any) {
    const ok = confirm("هل تريد حذف هذه الفئة؟");
    if (!ok) return;

    await supabase
      .from("categories")
      .delete()
      .eq("id", cat.id);

    loadData();
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">الفئات</h1>
          <p className="text-sm text-gray-500 mt-1">
            قم بتنظيم منتجاتك داخل مجموعات واضحة.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
        >
          <HiPlus size={18} />
          إضافة فئة
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          جاري التحميل...
        </div>
      )}

      {/* Categories Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full p-6 bg-white rounded-xl shadow border text-center text-gray-600">
              لا توجد فئات — اضغط إضافة فئة.
            </div>
          ) : (
            categories.map((cat, index) => {
              const colorClass = categoryColors[index % categoryColors.length];

              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                >
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full mb-3 ${colorClass}`}
                  >
                    فئة
                  </span>

                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4">
                    عدد المنتجات:{" "}
                    <span className="text-gray-900 font-medium">
                      {productsCount[cat.id] || 0}
                    </span>
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openEdit(cat)}
                      className="flex items-center gap-2 text-sm px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <HiPencil size={16} /> تعديل
                    </button>

                    <button
                      onClick={() => remove(cat)}
                      className="flex items-center gap-2 text-sm px-3 py-2 border border-red-200 rounded-md text-red-600 hover:bg-red-50"
                    >
                      <HiTrash size={16} /> حذف
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div
            className="absolute inset-0"
            onClick={() => setModalOpen(false)}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-gray-200 z-10"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editing ? "تعديل الفئة" : "إضافة فئة جديدة"}
            </h3>

            <label className="block text-gray-700 text-sm mb-1">
              اسم الفئة
            </label>
            <input
              className="w-full border border-gray-300 px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-200"
              >
                إلغاء
              </button>

              <button
                onClick={save}
                disabled={saving || name.trim().length === 0}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
