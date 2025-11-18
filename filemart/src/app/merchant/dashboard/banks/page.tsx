"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi2";

type BankAccount = {
  id: string;
  merchant_id: string;
  bank_name: string;
  account_number: string;
  account_owner: string;
  created_at: string | null;
};

export default function BanksPage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  // modal state
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  // form
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountOwner, setAccountOwner] = useState("");

  // messages
  const [message, setMessage] = useState<string | null>(null);

  // load accounts for current user
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      // get merchant profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.id) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("merchant_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setMessage("تعذر جلب الحسابات");
        setAccounts([]);
      } else if (mounted) {
        setAccounts((data as BankAccount[]) || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // open modal for create
  function openCreate() {
    setEditing(null);
    setBankName("");
    setAccountNumber("");
    setAccountOwner("");
    setOpenModal(true);
  }

  // open modal for edit
  function openEdit(acc: BankAccount) {
    setEditing(acc);
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setAccountOwner(acc.account_owner);
    setOpenModal(true);
  }

  // validate form
  function valid() {
    return bankName.trim().length > 1 && accountNumber.trim().length > 3;
  }

  // save (create or update)
  async function save() {
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("يرجى تسجيل الدخول");
      setSaving(false);
      return;
    }

    // find merchant id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.id) {
      setMessage("لم يتم العثور على ملف التاجر");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        // update
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            bank_name: bankName,
            account_number: accountNumber,
            account_owner: accountOwner,
          })
          .eq("id", editing.id);

        if (error) throw error;

        // update local list
        setAccounts((prev) =>
          prev.map((p) => (p.id === editing.id ? { ...p, bank_name: bankName, account_number: accountNumber, account_owner: accountOwner } : p))
        );

        setMessage("تم تحديث الحساب");
      } else {
        // insert
        const { error, data } = await supabase
          .from("bank_accounts")
          .insert({
            merchant_id: profile.id,
            bank_name: bankName,
            account_number: accountNumber,
            account_owner: accountOwner,
          })
          .select()
          .single();

        if (error) throw error;

        setAccounts((prev) => [data as BankAccount, ...prev]);
        setMessage("تم إضافة الحساب");
      }

      setOpenModal(false);
    } catch (err: any) {
      console.error(err);
      setMessage("حدث خطأ أثناء الحفظ");
    }

    setSaving(false);
  }

  // delete account
  async function removeAccount(acc: BankAccount) {
    const ok = confirm("هل تريد حذف هذا الحساب؟ العملية لا يمكن التراجع عنها.");
    if (!ok) return;

    const { error } = await supabase.from("bank_accounts").delete().eq("id", acc.id);

    if (error) {
      console.error(error);
      setMessage("فشل حذف الحساب");
    } else {
      setAccounts((prev) => prev.filter((p) => p.id !== acc.id));
      setMessage("تم حذف الحساب");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">الحسابات البنكية</h1>
          <p className="text-sm text-gray-500 mt-1">أضف حساباتك البنكية لتظهر في ملف المتجر وتسهل استلام المدفوعات.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
          >
            <HiPlus size={18} />
            <span>إضافة حساب</span>
          </button>
        </div>
      </div>

      {/* messages */}
      {message && (
        <div className="mb-4">
          <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">{message}</div>
        </div>
      )}

      {/* content */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 text-gray-600">جارٍ جلب الحسابات...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 bg-white rounded-xl neu-card border border-gray-100 text-center text-gray-600">
            لا توجد حسابات بنكية حتى الآن — أضف أول حساب
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{acc.bank_name}</h3>
                  <p className="text-sm text-gray-600 mt-2">الحساب: <span className="text-gray-800 font-medium">{acc.account_number}</span></p>
                  <p className="text-sm text-gray-600 mt-1">صاحب الحساب: <span className="text-gray-800">{acc.account_owner || "-"}</span></p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => openEdit(acc)} className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50">
                    <HiPencil size={16} />
                    تعديل
                  </button>

                  <button onClick={() => removeAccount(acc)} className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-red-100 rounded-md text-red-600 hover:bg-red-50">
                    <HiTrash size={16} />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenModal(false)} />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editing ? "تعديل الحساب" : "إضافة حساب بنكي"}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">اسم البنك</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">رقم الحساب</label>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">اسم صاحب الحساب (اختياري)</label>
                <input value={accountOwner} onChange={(e) => setAccountOwner(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-md" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setOpenModal(false)} className="px-3 py-2 rounded-md border border-gray-200 text-sm">إلغاء</button>
              <button
                onClick={save}
                disabled={!valid() || saving}
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة الحساب"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
