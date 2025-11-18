"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function MerchantLogin() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function ensureProfileExists(userId: string) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        user_id: userId,
        store_name: "",
        description: "",
        phone: "",
        address: "",
        store_logo: null,
      });
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("يرجى إدخال البريد وكلمة المرور");
      setLoading(false);
      return;
    }

    try {
      let authRes;

      if (mode === "login") {
        authRes = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        authRes = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (authRes.error) {
        setErrorMsg(authRes.error.message);
        setLoading(false);
        return;
      }

      const user = authRes.data.user;
      if (!user) {
        setErrorMsg("تعذر تسجيل الدخول");
        setLoading(false);
        return;
      }

      // Create profile row if missing
      await ensureProfileExists(user.id);

      router.push("/merchant/dashboard/profile");
    } catch (err: any) {
      setErrorMsg("حدث خطأ غير متوقع");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </h1>

        {errorMsg && (
          <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4 text-center">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading
              ? "جاري المعالجة..."
              : mode === "login"
              ? "دخول"
              : "إنشاء حساب"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-600 hover:underline"
          >
            {mode === "login"
              ? "إنشاء حساب جديد"
              : "لديك حساب؟ تسجيل الدخول"}
          </button>
        </div>
      </div>
    </div>
  );
}
