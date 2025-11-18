"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi2";
import ProductFormModal from "@/components/ProductFormModal";

// Interfaces
interface Product {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
  created_at: string | null;
}

interface Category {
  id: string;
  name: string;
  merchant_id: string;
}

// Category Colors
const categoryColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-yellow-100 text-yellow-700",
];

export default function ProductsPage() {
  const supabase = createClientComponentClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get merchant profile id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    // Load categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .eq("merchant_id", profile.id)
      .order("name");

    setCategories(cats || []);

    // Load products
    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", profile.id)
      .order("created_at", { ascending: false });

    setProducts(prods || []);
    setLoading(false);
  }

  // Open create modal
  function openCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  // Open edit modal
  function openEdit(prod: Product) {
    setEditingProduct(prod);
    setModalOpen(true);
  }

  async function deleteProduct(prod: Product) {
    const ok = confirm("هل تريد حذف المنتج؟");
    if (!ok) return;

    await supabase.from("products").delete().eq("id", prod.id);
    loadData();
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">المنتجات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة منتجات متجرك.</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
        >
          <HiPlus size={18} />
          إضافة منتج
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          جاري تحميل المنتجات...
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full p-6 bg-white rounded-xl border shadow text-center text-gray-600">
              لا توجد منتجات — اضغط إضافة منتج.
            </div>
          ) : (
            products.map((prod, index) => {
              const category = categories.find((c) => c.id === prod.category_id);
              const color = categoryColors[index % categoryColors.length];

              return (
                <motion.div
                  key={prod.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-5 rounded-xl border shadow-sm flex gap-4"
                >
                  {/* Image */}
                  <div>
                    <img
                      src={prod.image_url || "/placeholder.png"}
                      className="w-24 h-24 rounded-lg border object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">

                    <div>
                      {category && (
                        <span
                          className={`inline-block text-xs px-3 py-1 rounded-full mb-2 ${color}`}
                        >
                          {category.name}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-gray-900">
                        {prod.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {prod.description || "بدون وصف"}
                      </p>

                      <p className="text-base font-semibold text-gray-800 mt-2">
                        {prod.price} ر.ي
                      </p>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => openEdit(prod)}
                        className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-2"
                      >
                        <HiPencil size={16} /> تعديل
                      </button>

                      <button
                        onClick={() => deleteProduct(prod)}
                        className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-2"
                      >
                        <HiTrash size={16} /> حذف
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* NEW PRODUCT MODAL — هذا هو الجديد */}
      {modalOpen && (
        <ProductFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => loadData()}
          product={editingProduct}
          categories={categories}
        />
      )}

    </div>
  );
}
