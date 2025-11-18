"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { HiX, HiPlus, HiSparkles } from "react-icons/hi2";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  product?: any | null; // if provided => edit mode
  categories: { id: string; name: string }[];
};

const STATUS_OPTIONS = [
  { value: "published", label: "منشور" },
  { value: "draft", label: "مسودة" },
  { value: "disabled", label: "غير مفعل" },
];

const WEIGHT_UNITS = ["g", "kg", "ml", "l", "pcs"];

function formatNumberInput(val: string) {
  // remove non-digits except dot
  const cleaned = val.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0,2)}` : parts[0];
}

function parseNumber(val: string) {
  if (!val) return 0;
  return Number(val.toString().replace(/,/g, ""));
}

function generateSKU(prefix = "FM") {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rnd}`;
}

export default function ProductFormModal({ open, onClose, onSaved, product, categories }: Props) {
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState(0);

  // form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | "">("");
  const [status, setStatus] = useState("published");
  const [sku, setSku] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [price, setPrice] = useState(""); // formatted
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");

  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [stockStatus, setStockStatus] = useState<"in_stock" | "out_of_stock">("in_stock");
  const [trackInventory, setTrackInventory] = useState(true);

  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState(WEIGHT_UNITS[0]);

  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([]);

  const [description, setDescription] = useState("");

  // images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      // populate fields for edit
      setName(product.name || "");
      setCategoryId(product.category_id || "");
      setStatus(product.status || "published");
      setSku(product.sku || "");
      setTags(product.tags || []);
      setPrice(product.price !== undefined ? formatNumberInput(String(product.price)) : "");
      setCompareAtPrice(product.compare_at_price !== undefined ? formatNumberInput(String(product.compare_at_price)) : "");
      setDiscountedPrice(product.discounted_price !== undefined ? formatNumberInput(String(product.discounted_price)) : "");
      setStockQuantity(product.stock_quantity ?? "");
      setStockStatus(product.stock_status || "in_stock");
      setTrackInventory(typeof product.stock_quantity === "number");
      setWeight(product.weight ? String(product.weight) : "");
      setWeightUnit(product.weight_unit || WEIGHT_UNITS[0]);
      setAttributes(product.attributes ? Object.entries(product.attributes).map(([k,v]) => ({ key:k, value:String(v) })) : []);
      setDescription(product.description || "");
      // load images previews from product_images table later if needed (we rely on product.image_url as preview)
      if (product.image_url) setImagePreviews([product.image_url]);
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, open]);

  function resetForm() {
    setName("");
    setCategoryId("");
    setStatus("published");
    setSku("");
    setTags([]);
    setPrice("");
    setCompareAtPrice("");
    setDiscountedPrice("");
    setStockQuantity("");
    setStockStatus("in_stock");
    setTrackInventory(true);
    setWeight("");
    setWeightUnit(WEIGHT_UNITS[0]);
    setAttributes([]);
    setDescription("");
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
  }

  // dropzone handlers
  function onFilesPicked(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const newFiles = [...imageFiles, ...arr].slice(0, 8); // limit 8 images
    setImageFiles(newFiles);

    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  }

  function removeImageAt(idx: number) {
    const f = [...imageFiles];
    const p = [...imagePreviews];
    f.splice(idx,1); p.splice(idx,1);
    setImageFiles(f);
    setImagePreviews(p);
  }

  function addTagFromInput(raw: string) {
    const cleaned = raw.split(",").map(s => s.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    setTags(prev => Array.from(new Set([...prev, ...cleaned])));
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function addAttribute() {
    setAttributes(prev => [...prev, { key:"", value:"" }]);
  }

  function updateAttribute(i:number, key:string, value:string) {
    setAttributes(prev => prev.map((a,idx) => idx===i ? { key, value } : a));
  }

  function removeAttribute(i:number) {
    setAttributes(prev => prev.filter((_,idx)=> idx!==i));
  }

  // validation
  function validate() {
    const e: Record<string,string> = {};
    if (!name.trim()) e.name = "الاسم مطلوب";
    if (!price || parseNumber(price) <= 0) e.price = "السعر يجب أن يكون رقمًا أكبر من صفر";
    if (trackInventory && (stockQuantity === "" || Number(stockQuantity) < 0)) e.stockQuantity = "أدخل كمية صالحة";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // helper
  function parseNumber(val:string) {
    if (!val) return 0;
    return Number(val.toString().replace(/,/g,""));
  }

  async function uploadFilesToStorage(productId: string, merchantId: string) {
    if (imageFiles.length === 0) return [];
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i=0;i<imageFiles.length;i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop() || "png";
      const path = `products/${merchantId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("assets").upload(path, file, { upsert: false });
      if (uploadErr) {
        console.error("uploadErr", uploadErr);
        continue;
      }
      const { data } = supabase.storage.from("assets").getPublicUrl(path);
      if (data?.publicUrl) {
        uploadedUrls.push(data.publicUrl);
        // insert into product_images table
        await supabase.from("product_images").insert({ product_id: productId, image_url: data.publicUrl });
      }
    }

    setUploading(false);
    return uploadedUrls;
  }

  async function handleSave() {
    if (!validate()) {
      setActiveTab(0);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("يرجى تسجيل الدخول");
        setSaving(false);
        return;
      }

      // ensure merchant id
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      const merchantId = profile?.id;
      if (!merchantId) {
        alert("لم يتم العثور على ملف التاجر");
        setSaving(false);
        return;
      }

      // prepare attributes as object
      const attributesObj: Record<string, string> = {};
      attributes.forEach(a => {
        if (a.key.trim()) attributesObj[a.key.trim()] = a.value;
      });

      const payload = {
        merchant_id: merchantId,
        name: name.trim(),
        price: parseNumber(price),
        description: description || null,
        category_id: categoryId || null,
        status,
        sku: sku || generateSKU("FM"),
        tags: tags.length ? tags : null,
        compare_at_price: parseNumber(compareAtPrice) || null,
        discounted_price: parseNumber(discountedPrice) || null,
        weight: weight ? Number(weight) : null,
        weight_unit: weightUnit || null,
        stock_quantity: trackInventory ? (stockQuantity === "" ? 0 : Number(stockQuantity)) : null,
        stock_status: stockStatus,
        attributes: Object.keys(attributesObj).length ? attributesObj : null,
      };

      if (product) {
        // update product
        await supabase.from("products").update(payload).eq("id", product.id);
        // upload images and insert product_images
        if (imageFiles.length > 0) {
          await uploadFilesToStorage(product.id, merchantId);
        }
      } else {
        // insert product
        const { data: inserted, error: insertErr } = await supabase.from("products").insert(payload).select().single();
        if (insertErr || !inserted?.id) {
          console.error("insertErr", insertErr);
          alert("فشل إنشاء المنتج");
          setSaving(false);
          return;
        }
        // upload images
        await uploadFilesToStorage(inserted.id, merchantId);
      }

      setSaving(false);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  // small UI pieces
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if(!saving) onClose(); }} />

          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="relative bg-white max-w-[600px] w-full rounded-2xl shadow-xl z-50 p-4 md:p-6 overflow-auto max-h-[90vh]"
          >
            {/* header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>
                <span className="text-sm text-gray-500">نافذة منظمة — حجم قصير ومركز على البيانات</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => { setSku(generateSKU("FM")); }} className="text-sm px-2 py-1 border rounded text-gray-600">توليد SKU</button>
                <button onClick={() => { if(!saving) onClose(); }} className="p-2 rounded hover:bg-gray-100">
                  <HiX size={18} />
                </button>
              </div>
            </div>

            {/* tabs */}
            <div className="flex gap-1 mb-4 border-b pb-2 overflow-x-auto">
              {["المعلومات الأساسية","الأسعار","المخزون","الصور","الخصائص","الوصف"].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(i)}
                  className={`text-sm px-3 py-2 rounded-md ${activeTab===i ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* content */}
            <div className="space-y-4">

              {/* Tab 0: basic info */}
              {activeTab === 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">اسم المنتج *</label>
                    <input value={name} onChange={(e)=> setName(e.target.value)} className={`w-full mt-1 px-3 py-2 border rounded ${errors.name ? "border-red-400" : "border-gray-200"}`} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">الفئة</label>
                      <select value={categoryId || ""} onChange={(e)=> setCategoryId(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded border-gray-200">
                        <option value="">بدون فئة</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">حالة المنتج</label>
                      <select value={status} onChange={(e)=> setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded border-gray-200">
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">SKU / كود المنتج</label>
                      <div className="flex gap-2 mt-1">
                        <input value={sku} onChange={(e)=> setSku(e.target.value)} className="flex-1 px-3 py-2 border rounded border-gray-200" />
                        <button onClick={()=> setSku(generateSKU("FM"))} className="px-3 py-2 bg-gray-100 rounded border">توليد</button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">العلامات (Tags)</label>
                      <input
                        placeholder="اكتب ثم اضغط Enter أو اكتب بقسمات"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTagFromInput((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        className="w-full mt-1 px-3 py-2 border rounded border-gray-200"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map(t => (
                          <span key={t} className="text-xs px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                            {t}
                            <button onClick={()=> removeTag(t)} className="text-red-500 text-xs px-1">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: prices */}
              {activeTab === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">السعر (ر.ي) *</label>
                    <input value={price} onChange={(e)=> setPrice(formatNumberInput(e.target.value))} className={`w-full mt-1 px-3 py-2 border rounded ${errors.price ? "border-red-400" : "border-gray-200"}`} />
                    {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">سعر قبل الخصم</label>
                      <input value={compareAtPrice} onChange={(e)=> setCompareAtPrice(formatNumberInput(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded border-gray-200" />
                    </div>

                    <div>
                      <label className="text-sm font-medium">السعر بعد الخصم</label>
                      <input value={discountedPrice} onChange={(e)=> setDiscountedPrice(formatNumberInput(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded border-gray-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: inventory */}
              {activeTab === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={trackInventory} onChange={(e)=> setTrackInventory(e.target.checked)} />
                    <label className="text-sm">تتبع المخزون</label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">الكمية المتاحة</label>
                      <input type="number" value={stockQuantity} onChange={(e)=> setStockQuantity(e.target.value === "" ? "" : Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded border-gray-200" />
                      {errors.stockQuantity && <p className="text-xs text-red-600 mt-1">{errors.stockQuantity}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium">حالة التوفر</label>
                      <select value={stockStatus} onChange={(e)=> setStockStatus(e.target.value as any)} className="w-full mt-1 px-3 py-2 border rounded border-gray-200">
                        <option value="in_stock">متوفر</option>
                        <option value="out_of_stock">غير متوفر</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">الوزن/الحجم</label>
                      <div className="flex gap-2 mt-1">
                        <input value={weight} onChange={(e)=> setWeight(e.target.value)} className="flex-1 px-3 py-2 border rounded border-gray-200" />
                        <select value={weightUnit} onChange={(e)=> setWeightUnit(e.target.value)} className="px-3 py-2 border rounded border-gray-200">
                          {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: images */}
              {activeTab === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">الصور (اختياري) — اسحب وأسقط أو اضغط للاختيار</label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      onFilesPicked(e.dataTransfer.files);
                    }}
                    className="border-dashed border-2 border-gray-200 rounded p-4 flex flex-col items-center justify-center text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-gray-500">اسحب الصور هنا أو اضغط للاختيار</div>
                    <div className="text-xs text-gray-400 mt-2">تنسيق مقترح: 1200×1200 — صيغة PNG/JPG — حتى 8 صور</div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e)=> onFilesPicked(e.target.files)} />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {imagePreviews.map((p, idx) => (
                        <div key={idx} className="relative">
                          <img src={p} className="w-full h-24 object-cover rounded" />
                          <button onClick={()=> removeImageAt(idx)} className="absolute top-1 left-1 bg-white p-1 rounded shadow text-red-600">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: attributes */}
              {activeTab === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">الخصائص الإضافية</h4>
                    <button onClick={addAttribute} className="text-sm px-3 py-1 border rounded">إضافة خاصية</button>
                  </div>

                  <div className="space-y-2">
                    {attributes.map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <input placeholder="الخاصية" value={a.key} onChange={(e)=> updateAttribute(i, e.target.value, a.value)} className="flex-1 px-3 py-2 border rounded border-gray-200" />
                        <input placeholder="القيمة" value={a.value} onChange={(e)=> updateAttribute(i, a.key, e.target.value)} className="flex-1 px-3 py-2 border rounded border-gray-200" />
                        <button onClick={()=> removeAttribute(i)} className="px-2 rounded border text-red-600">حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: description */}
              {activeTab === 5 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">الوصف</label>
                  <textarea value={description} onChange={(e)=> setDescription(e.target.value)} className="w-full h-40 px-3 py-2 border rounded border-gray-200" />
                </div>
              )}
            </div>

            {/* footer actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => { if(!saving) onClose(); }} className="px-4 py-2 border rounded">إلغاء</button>
              <button onClick={handleSave} disabled={saving || uploading} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {saving ? "جاري الحفظ..." : (product ? "حفظ التعديلات" : "حفظ المنتج")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
