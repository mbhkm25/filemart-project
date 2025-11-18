"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("store_name,description,phone,address,store_logo")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setStoreName(data.store_name || "");
        setDescription(data.description || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setLogo(data.store_logo || null);
        setPreviewUrl(data.store_logo || null);
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    // show local preview when user picks a file
    if (!logoFile) {
      setPreviewUrl(logo || null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, logo]);

  async function uploadLogo(userId: string) {
    if (!logoFile) return logo;

    // ensure bucket 'assets' exists and is public
    const fileExt = logoFile.name.split(".").pop();
    const filePath = `logos/${userId}-${Date.now()}.${fileExt || "png"}`;

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, logoFile, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      console.error("uploadError", uploadError);
      alert("حدث خطأ أثناء رفع الشعار");
      return logo;
    }

    const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function save() {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً");
      setSaving(false);
      return;
    }

    const logoUrl = await uploadLogo(user.id);

    const { error } = await supabase
      .from("profiles")
      .update({
        store_name: storeName,
        description,
        phone,
        address,
        store_logo: logoUrl,
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (!error) {
      // subtle success animation
      alert("تم حفظ بيانات المتجر بنجاح");
    } else {
      console.error(error);
      alert("فشل الحفظ. حاول مرة أخرى.");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-500">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10 items-start">
      {/* Side panel - Logo (Panel منفصل كما طلبت) */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="logo-panel"
        aria-hidden={false}
      >
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-100 shadow-sm mb-3"
               style={{ background: "linear-gradient(180deg,#fff,#f7f9fc)" }}>
            {previewUrl ? (
              <img src={previewUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span style={{ fontSize: 14 }}>لا يوجد شعار</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <label className="file-input cursor-pointer inline-flex items-center gap-2">
              اختر صورة
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-sm text-gray-500 text-center mt-2 px-2">
            أفضل حجم: 400×400. الصيغ: PNG/JPG. سيتم تحويل الصورة تلقائياً.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="w-full">
          <button
            onClick={() => {
              // quick preview: open public profile in new tab if logo exists
              // we will open profile public link later; for now just show alert
              alert("رابط معاينة البروفايل سيتوفر عندما تحفظ البيانات");
            }}
            className="w-full bg-transparent border border-gray-200 text-gray-700 py-2 rounded-lg text-sm"
          >
            معاينة البروفايل
          </button>
        </div>
      </motion.aside>

      {/* Main card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 neu-card p-6 md:p-10"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">إعدادات المتجر</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md shadow"
            >
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button
              onClick={() => {
                // reset fields: reload from DB
                setLoading(true);
                setLogoFile(null);
                // reload
                (async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const { data } = await supabase
                    .from("profiles")
                    .select("store_name,description,phone,address,store_logo")
                    .eq("user_id", user.id)
                    .single();
                  if (data) {
                    setStoreName(data.store_name || "");
                    setDescription(data.description || "");
                    setPhone(data.phone || "");
                    setAddress(data.address || "");
                    setLogo(data.store_logo || null);
                    setPreviewUrl(data.store_logo || null);
                  }
                  setLoading(false);
                })();
              }}
              className="text-sm px-3 py-2 border border-gray-200 rounded-md text-gray-700"
            >
              إعادة تحميل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المتجر</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="neu-input w-full px-4 py-3 text-gray-900 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">نبذة عن المتجر</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="neu-input w-full px-4 py-3 h-28 resize-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="neu-input w-full px-4 py-3 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="neu-input w-full px-4 py-3 text-gray-900"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="text-sm text-gray-500">الحالة: <span className="text-gray-700">مسجّل</span></div>
          <div className="text-sm text-gray-500">آخر تحديث: <span className="text-gray-700">—</span></div>
        </div>
      </motion.section>
    </div>
  );
}
